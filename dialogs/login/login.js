// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// correction.js defines the correction dialog

// Import required Bot Builder
const { MessageFactory } = require('botbuilder');

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt, ChoicePrompt } = require('botbuilder-dialogs');

// User state for greeting dialog
const { EntityProfile } = require('../entityProfile');

// Identifies the last question asked.
const login = {
    Deactivated: "deactivated",
    Invalid: "invalid",
    LDAP:"ldap",
    Transaction:"transaction",
    Unauthorized:"not authorized"
}

// Prompt IDs
const CONFIRM_PROMPT = 'confirm_prompt'

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 * @param {PropertyStateAccessor} entityProfileAccessor property accessor for user state
 */
class Login extends ComponentDialog {
    constructor(dialogId, entityProfileAccessor) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw ('Missing parameter.  dialogId is required');
        if (!entityProfileAccessor) throw ('Missing parameter.  entityProfileAccessor is required');

        // Add a water fall dialog with 4 steps.
        // The order of step function registration is importent
        // as a water fall dialog executes steps registered in order
        this.addDialog(new WaterfallDialog(dialogId, [
            this.initializeStateStep.bind(this),
            this.responseForStep.bind(this)
        ]));

        // Add choice prompts for name and city
        this.addDialog(new ChoicePrompt(CONFIRM_PROMPT));

        // Save off our state accessor for later use
        this.entityProfileAccessor = entityProfileAccessor;
    }
    /**
     * Waterfall Dialog step functions.
     * 
     * Initialize our state.  See if the WaterfallDialog has state pass to it
     * If not, then just new up an empty UserProfile object
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async initializeStateStep(step) {

        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile === undefined || (entityProfile && !entityProfile.entity)) {
            var reply = MessageFactory.suggestedActions(
                [
                    'Invalid userid/password',
                    'User Id not defined in LDAP',
                    'Not authorized to access RP due to invalid LOC/DEPT',
                    'You are currently deactivated in the system',
                    'Transaction not successfully started'
                ],
                'Ok, glad to help you on that. Please select the appropriate issue from the dropdown ?');

            await step.context.sendActivity(reply);
            return await step.endDialog();
        }
        return await step.next();
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for their name.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async responseForStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == login.LDAP) {
            await step.context.sendActivity("Please follow the below steps.");
            await step.context.sendActivity("i) Contact your HR to active your profile in LDAP.");
            await step.context.sendActivity("ii)Contact your business admin to activate in RP.");
            await step.context.sendActivity("You can refer help tab for business admin contacts.");
        }
        else if (entityProfile && entityProfile.entity.toLowerCase() == login.Invalid) {
            await step.context.sendActivity("Please reset your password .Is still issue persists try login after clearing the browser caches.");
        }
        else if (entityProfile && entityProfile.entity.toLowerCase() == login.Transaction) {
            await step.context.sendActivity("This error occurs when any user/supervisor himself assigned as supervisor in PDM. ");
            await step.context.sendActivity("Please check your profile and your supervisor profile, and your supervisor's supervisor profile and so on.");
            await step.context.sendActivity("Then correct the supervisor for the concerned person.");
        }
        else if (entityProfile && (entityProfile.entity.toLowerCase() == login.Unauthorized || entityProfile.entity.toLowerCase() ==login.Deactivated)) {
            await step.context.sendActivity("Please contact your business admin to activate in RP.");
            await step.context.sendActivity("You can refer help tab for business admin contacts.");
        }
        return await step.next();
    }
}

exports.LoginDialog = Login;