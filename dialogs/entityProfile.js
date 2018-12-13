// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Simple Entity class.
 */
class EntityProfile {
    constructor(entity, action, reset) {
        this.entity = entity || undefined;
        this.reset = reset || true;
    }
};

exports.EntityProfile = EntityProfile;
