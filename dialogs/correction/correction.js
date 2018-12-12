// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// correction.js defines the correction dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');

// User state for greeting dialog
const { EntityProfile } = require('../entityProfile');

// Dialog IDs 
const APPROVER_DIALOG = 'approverDialog';
const SUPERVISOR_DIALOG = 'supervisorDialog';
const BACKUP_APPROVER_DIALOG = 'backupApproverDialog';

// Prompt IDs
const SUP_APPR_PROMPT = 'sup-appr-Prompt';
const YES_NO_PROMPT = 'yes_no_Prompt';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

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
class Greeting extends ComponentDialog {
    constructor(dialogId, entityProfileAccessor) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw ('Missing parameter.  dialogId is required');
        if (!entityProfileAccessor) throw ('Missing parameter.  entityProfileAccessor is required');

        // Add a water fall dialog with 4 steps.
        // The order of step function registration is importent
        // as a water fall dialog executes steps registered in order
        this.addDialog(new WaterfallDialog(APPROVER_DIALOG, [
            this.initializeStateStep.bind(this),
            this.promptForApproverStep.bind(this),
            this.promptForSupervisorStep.bind(this),
            this.promptForBackupApproverStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog(SUPERVISOR_DIALOG, [
            this.promptForSupervisorStep.bind(this),
            this.promptForBackupApproverStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog(BACKUP_APPROVER_DIALOG, [
            this.promptForBackupApproverStep.bind(this)
        ]));

        // Add text prompts for supervisor/backup approver and yes/no
        this.addDialog(new TextPrompt(SUP_APPR_PROMPT, this.validateSupervisor_Backup_Approver));
        this.addDialog(new TextPrompt(YES_NO_PROMPT, this.validateYes_No));

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
        if (entityProfile === undefined) {
            if (step.options && step.options.entityProfile) {
                await this.entityProfileAccessor.set(step.context, step.options.entityProfile);
            } else {
                await this.entityProfileAccessor.set(step.context, new EntityProfile());
            }
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
    async promptForApproverStep(step) {
        const entityProfile = await this.userProfileAccessor.get(step.context);
        // if we have everything we need, greet user and return
        if (entityProfile !== undefined && entityProfile.entity !== undefined) {
            return await this.greetUser(step);
        }
        if (!entityProfile.entity) {
            // prompt for name, if missing
            return await step.prompt(SUP_APPR_PROMPT, 'Do you want to update Supervisor or Backup Approver?');
        } else {
            return await step.next();
        }
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForSupervisorStep(step) {
        // save name, if prompted for
        const roleProfile = await this.entityProfileAccessor.get(step.context);
        if (roleProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            roleProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.entityProfileAccessor.set(step.context, roleProfile);
        }
        if (!roleProfile.city) {
            return await step.prompt(YES_NO_PROMPT, `Has the supervisor`);
        } else {
            return await step.next();
        }
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForBackupApproverStep(step) {
        // save name, if prompted for
        const roleProfile = await this.entityProfileAccessor.get(step.context);
        if (roleProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            roleProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.entityProfileAccessor.set(step.context, roleProfile);
        }
        if (!roleProfile.city) {
            return await step.prompt(CITY_PROMPT, `Hello ${ roleProfile.name }, what city do you live in?`);
        } else {
            return await step.next();
        }
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Having all the data we need, simply display a summary back to the user.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async displayGreetingStep(step) {
        // Save city, if prompted for
        const roleProfile = await this.entityProfileAccessor.get(step.context);
        if (roleProfile.city === undefined && step.result) {
            let lowerCaseCity = step.result;
            // capitalize and set city
            roleProfile.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
            await this.entityProfileAccessor.set(step.context, roleProfile);
        }
        return await this.greetUser(step);
    }
    /**
     * Validator function to verify that user name meets required constraints.
     *
     * @param {PromptValidatorContext} validation context for this validator.
     */
    async validateSupervisor_Backup_Approver(validatorContext) {
        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();
        if (value.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(`Names need to be at least ${ NAME_LENGTH_MIN } characters long.`);
            return VALIDATION_FAILED;
        }
    }
    /**
     * Validator function to verify if city meets required constraints.
     *
     * @param {PromptValidatorContext} validation context for this validator.
     */
    async validateYes_No(validatorContext) {
        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();
        if (value.length >= CITY_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(`City names needs to be at least ${ CITY_LENGTH_MIN } characters long.`);
            return VALIDATION_FAILED;
        }
    }
    /**
     * Helper function to greet user with information in greetingState.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async greetUser(step) {
        const roleProfile = await this.entityProfileAccessor.get(step.context);
        // Display to the user their profile information and end dialog
        await step.context.sendActivity(`Hi ${ roleProfile.name }, from ${ roleProfile.city }, nice to meet you!!`);
        await step.context.sendActivity(`You can always say 'My name is <your name> to reintroduce yourself to me.`);
        return await step.endDialog();
    }
}

exports.GreetingDialog = Greeting;
