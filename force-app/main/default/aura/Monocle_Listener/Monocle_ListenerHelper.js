({
    subscribeToVoiceToolkit: function(cmp) { 
        cmp._conversationEventListener = $A.getCallback(this.voiceConversationEventListener.bind(this, cmp));
        cmp.find('voiceToolkitApi').addConversationEventListener('TRANSCRIPT', cmp._conversationEventListener);
    },
    
    unsubscribeFromVoiceToolkit: function(cmp) {
        cmp.find('voiceToolkitApi').removeConversationEventListener('TRANSCRIPT', cmp._conversationEventListener);
    },
    // Voice Transcripts (Customer and Agent)
    voiceConversationEventListener: function(cmp, transcript) {
        var transcriptText = transcript.detail.content.text;
        var speaker = transcript.detail.sender.role;  
        var recordId = cmp.get("v.recordId");
        //Confirm that the component is on a Voice Call Record page
        if (recordId.startsWith("0LQ"))
        {
            this.checkIntents(cmp, transcriptText, speaker); 
            this.checkSentiment(cmp, transcriptText, speaker); 
            this.checkNER(cmp, transcriptText, speaker); 
        }
    },
    // Chat/Messaging Transcripts (Customer and Agent)
    chatConversationEventListener: function(cmp, evt, speaker) {
        var transcriptText = evt.getParam('content');
        var recordId = cmp.get("v.recordId");
        var chatRecordId = evt.getParam("recordId");       
        //Confirm that the Event came from the Chat that the component is on
        if (recordId.includes(chatRecordId))
        {
            this.checkIntents(cmp, transcriptText, speaker); 
            this.checkSentiment(cmp, transcriptText, speaker); 
            this.checkNER(cmp, transcriptText, speaker); 
        }
    },
    
    checkIntents: function(component, transcriptText, speaker)
    {
        if (!component.get('v.iModelID'))
        {
            return;
        }
        
        var action = component.get('c.checkIntent'); 
        action.setParams({
            "utteranceText" : transcriptText,
            "iModelId" : component.get('v.iModelID')
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                //Call Lightning Event
                var appEvent = $A.get("e.c:Monocle_PredictionPayload");
                // Optional: set some data for the event (also known as event shape)
                // A parameter’s name must match the name attribute
                // of one of the event’s <aura:attribute> tags
                appEvent.setParams({ "recordId" : component.get("v.recordId"), "type" : "intent", "speaker" : speaker, "utterance" : transcriptText, "payload": a.getReturnValue()});
                appEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    
    checkSentiment: function(component, transcriptText, speaker)
    {
        if (!component.get('v.sModelID'))
        {
            return;
        }
        
        var action = component.get('c.checkSentiment'); 
        action.setParams({
            "utteranceText" : transcriptText,
            "sModelId" : component.get('v.sModelID')
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                //Call Lightning Event
                var appEvent = $A.get("e.c:Monocle_PredictionPayload");
                // Optional: set some data for the event (also known as event shape)
                // A parameter’s name must match the name attribute
                // of one of the event’s <aura:attribute> tags
                appEvent.setParams({ "recordId" : component.get("v.recordId"), "speaker" : speaker, "type" : "sentiment", "utterance" : transcriptText,  "payload" : a.getReturnValue()});
                appEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    
    checkNER: function(component, transcriptText, speaker)
    {
        var action = component.get('c.checkNER'); 
        action.setParams({
            "utteranceText" : transcriptText
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                //Call Lightning Event
                var appEvent = $A.get("e.c:Monocle_PredictionPayload");
                // Optional: set some data for the event (also known as event shape)
                // A parameter’s name must match the name attribute
                // of one of the event’s <aura:attribute> tags
                appEvent.setParams({ "recordId" : component.get("v.recordId"), "speaker" : speaker, "type" : "named entity",  "utterance" : transcriptText, "payload" : a.getReturnValue()});
                appEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    
    checkScore: function(component, event, helper)
    {
        var items = component.get('v.predictions');
        var i;
        var completedCount = 0;
        for (i = 0; i < items.length; i++) 
        {
            if (items[i].completed)
            {
                completedCount++;
            }
        }
        
        var theratio = completedCount / items.length * 100;
        component.set('v.feedbackResponseScore', Math.ceil(theratio / 10) * 10);
    }
})