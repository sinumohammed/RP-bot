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
const reports = {
    BIRT: "BIRT",
    Qliksense: "Qliksense",
    Qlikview: "Qlikview"
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
class Report extends ComponentDialog {
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
            this.promptForBIRTStep.bind(this),
            this.responseForBIRTStep.bind(this),
            this.responseForBIRTBrowsersStep.bind(this),
            this.promptForQlikviewStep.bind(this),
            this.responseForQlikviewStep.bind(this),
            this.promptForQliksenseStep.bind(this)
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
                    'Qlikview',
                    'BIRT(From Report Tab)',
                    'Qliksense'
                ],
                'Please let me know the tool which you are trying?');

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
    async promptForBIRTStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.BIRT) {
            entityProfile.reset = false;
            await this.entityProfileAccessor.set(step.context, entityProfile);
            return await step.prompt(CONFIRM_PROMPT, 'Are you using Windows 10 ?', ['Yes', 'No']);
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
    async responseForBIRTStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.BIRT) {
            if (step.result && step.result.value.toLowerCase() === 'yes') {
                await step.context.sendActivity("BIRT reports are not accessible in windows 10. Please use Qlikview & Qliksense for RP reports extraction.");
                await step.context.sendActivity("Contact your business admin for the accessibility.");
            } else {
                entityProfile.reset = false;
                await this.entityProfileAccessor.set(step.context, entityProfile);
                return await step.prompt(CONFIRM_PROMPT, 'Which Browser you are logged in ?', ['Internet explorer', 'Chrome', 'Firefox']);
            }
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
    async responseForBIRTBrowsersStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.BIRT) {
            if (step.result && step.result.value.toLowerCase() === 'internet explorer') {
                await step.context.sendActivity("Please raise an incident to RP team in driveIT with the  issue description.");
            } else {
                await step.context.sendActivity("Pleae try accessing BIRT report in Internet explorer.");
            }
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
    async promptForQlikviewStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.Qlikview) {
            entityProfile.reset = false;
            await this.entityProfileAccessor.set(step.context, entityProfile);
            return await step.prompt(CONFIRM_PROMPT, 'Please select an issue that you are facing ?', ['Access Denied', 'Not showing the recent data']);
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
    async responseForQlikviewStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.Qlikview) {
            if (step.result && step.result.value.toLowerCase() === 'access Denied') {
                await step.context.sendActivity('Please try the user name as: domain\TID.Ex: CAG\T000AA.');
            } else {
                await step.context.sendActivity("The qlikview data refresh time is : 9.30 PM EST.");
                await step.context.sendActivity("Please try to extract the report after the  refresh timings.");
            }
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
    async promptForQliksenseStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.Qliksense) {
            entityProfile.reset = false;
            await this.entityProfileAccessor.set(step.context, entityProfile);
            return await step.prompt(CONFIRM_PROMPT, 'Please select an issue that you are facing ?', ['Access Denied', 'Not showing the recent data']);
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
    async responseForQlikviewStep(step) {
        let entityProfile = await this.entityProfileAccessor.get(step.context);
        if (entityProfile && entityProfile.entity.toLowerCase() == reports.Qliksense) {
            if (step.result && step.result.value.toLowerCase() === 'access Denied') {
                await step.context.sendActivity('Please try the user name as: domain\TID.Ex: CAG\T000AA .');
                await step.context.sendActivity('Please contact your business admin for the accessibility and training.');
            } else {
                await step.context.sendActivity("Please see the refresh time for each reports below: ");
                await step.context.sendActivity("Participation : 5.30 AM EST");
                await step.context.sendActivity("DOE-Grant : 10.30 PM EST");
                await step.context.sendActivity("Active Projects : 10.30 PM EST.");
                await step.context.sendActivity("Please try to extract the report after 45 mins of refresh timings to get the latest data.");
            }
        }
        return await step.next();
    }
}

exports.ReportDialog = Report;