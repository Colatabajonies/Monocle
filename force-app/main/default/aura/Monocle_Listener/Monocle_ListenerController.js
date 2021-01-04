({
	doInit : function(component, event, helper) 
    {
        if (!component.get('v.recordId') && component.get('v.contextRecordId'))
        {
            component.set('v.recordId', component.get('v.contextRecordId'));
        }
        
        //If recordId is Voice Call
        if (component.get('v.recordId') && component.get('v.recordId').startsWith('0LQ'))
        {
            helper.subscribeToVoiceToolkit(component);
        }
        else if (component.get('v.recordId') && component.get('v.recordId').startsWith('570'))
        {
            //Chat Transcript
        }
    },
    
    onDestroy: function(cmp, event, helper) {
        helper.unsubscribeFromVoiceToolkit(cmp);
    },
    // Chat Transcript Customer
    onChatTranscriptCustomer: function(cmp, evt, helper){
        helper.chatConversationEventListener(cmp, evt, 'Customer');        
    },
    
    // Chat Transcript Agent
    onChatTranscriptAgent: function(cmp, evt, helper){
        helper.chatConversationEventListener(cmp, evt,'Agent');
    },
    
    updateScore: function(component, event, helper)
    {
        //return if for a different recordId
        if (!component.get('v.recordId') || component.get('v.recordId').toLowerCase() != event.getParam("recordId").toLowerCase())
        {
            return;
        }
        
        //Else this is for the recordId
        var items = component.get('v.predictions');
        var i;
        for (i = 0; i < items.length; i++) 
        {
            if (items[i].title == event.getParam("title"))
            {
                items[i].completed = event.getParam("completed");
                items[i].value = event.getParam("value");
                component.set('v.predictions', items);
                helper.checkScore(component, event, helper);
                return;
            }
        }
        
        //Else its not in the array
        let item = {
            "title": event.getParam("title"),
            "completed": event.getParam("completed"),
            "value": event.getParam("value")
        }
        items.push(item);
        component.set('v.predictions', items);
        helper.checkScore(component, event, helper);
    },
})