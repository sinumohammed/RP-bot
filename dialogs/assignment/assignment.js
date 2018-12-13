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
const assignment = {
    Disabled: "disabled",
    Visible: "visible"
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
class Assignment extends ComponentDialog {
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
            this.promptForDisabledStep.bind(this),
            this.responseForDisabledStep.bind(this),
            this.promptForVisibleStep.bind(this)
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
                    'Assign Project Button is disabled',
                    'Project type/Project/Model Year is not visible'
                ],
                'Ok, glad to help you on that. Which issue you are facing now?');

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
    async promptForDisabledStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == assignment.Disabled) {
            entityProfile.reset = false;
            await this.entityProfileAccessor.set(step.context, entityProfile);
            await step.context.sendActivity('For NAFTA users , Assign Project feature is enabled only for two weeks and for other region users, it is enabled for one month.');
            await step.context.sendActivity('If you want to assign project out of  this timeframe, please create Task in Drive IT with business Admin approval.');
            return await step.prompt(CONFIRM_PROMPT, 'Do you want to create the task in DriveIT now ?', ['Yes', 'No']);
        }
        return await step.next();
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async responseForDisabledStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == assignment.Disabled) {
            if (step.result && step.result.value.toLowerCase() === 'yes') {
                await step.context.sendActivity("Ok. I created a task <b>RP:102036</b> for you.");
            }
            entityProfile.reset = true;
            await this.entityProfileAccessor.set(step.context, entityProfile);
        }
        return await step.next();
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForVisibleStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == assignment.Visible) {
            await step.context.sendActivity("Please contact your business admin .You can refer help tab for  admin details");
        }
        return await step.next();
    }    
}

exports.AssignmentDialog = Assignment;