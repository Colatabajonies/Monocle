({
	loadInsight : function(component, event, helper) 
    {
        var action = component.get('c.loadInsight'); 
        action.setParams({
            "recordId" : component.get('v.recordId'),
            "title" : component.get('v.inputTitle')
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                var mr = a.getReturnValue();
                component.set('v.completed', mr.Completed__c);
                component.set('v.strValue', mr.MatchValue__c);
                component.set('v.oValueBool', mr.Completed__c);
                component.set('v.oValueString', mr.MatchValue__c);
                
                //Fire Event
                var appEvent = $A.get("e.c:Monocle_PredictionStatus");
                appEvent.setParams({ "recordId" : component.get("v.recordId"), 
                                    "title" : component.get('v.inputTitle'), 
                                    "completed" : mr.Completed__c, 
                                    "value" : mr.MatchValue__c});
                appEvent.fire();
            }
        });
        $A.enqueueAction(action);
	},
    
    checkActive : function(component, event, helper) 
    {
        var action = component.get('c.checkIsActive'); 
        action.setParams({
            "recordId" : component.get('v.recordId')
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                var active = a.getReturnValue();
                component.set('v.active', active);
            }
        });
        $A.enqueueAction(action);
    },
    
    checkprediction : function(component, event, helper) 
    {
        //Don't run if already completed
        if (component.get('v.completed'))
        {
            return;
        }
        
        var action = component.get('c.checkPrediction'); 
        action.setParams({
            "recordId" : component.get('v.recordId'),
            "title" : component.get('v.inputTitle'),
            "utteranceText" : event.getParam("utterance"),
            "speaker" : event.getParam("speaker"),
            "matchType" : component.get('v.matchType'),
            "matchValue" : component.get('v.matchValue'),
            "speakerMatch" : component.get('v.speakerMatch'),
            "payload" : event.getParam("payload")
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                var mr = a.getReturnValue();
                component.set('v.completed', mr.Completed__c);
                component.set('v.strValue', mr.MatchValue__c);
                component.set('v.oValueBool', mr.Completed__c);
                component.set('v.oValueString', mr.MatchValue__c);
                
                //Fire Event
                var appEvent = $A.get("e.c:Monocle_PredictionStatus");
                appEvent.setParams({ "recordId" : component.get("v.recordId"), 
                                    "title" : component.get('v.inputTitle'), 
                                    "completed" : mr.Completed__c, 
                                    "value" : mr.MatchValue__c});
                appEvent.fire();
                
                //navigate flow
                if (mr.Completed__c && component.get("v.autoNav"))
                {
                    var navigate = component.get("v.navigateFlow");
                    if (navigate)
                    {
                        navigate("NEXT");
                    }
                }
            }
        });
        $A.enqueueAction(action);
	},
    
    updateItem : function(component, event, helper)
    {
        var action = component.get('c.updateInsight'); 
        action.setParams({
            "recordId" : component.get('v.recordId'),
            "title" : component.get('v.inputTitle'),
            "completed" : component.get('v.completed'),
            "matchValue" : component.get('v.strValue'),
            "utterance" : component.get('v.utterance')
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                var mr = a.getReturnValue();
                component.set('v.completed', mr.Completed__c);
                component.set('v.strValue', mr.MatchValue__c);
                component.set('v.oValueBool', mr.Completed__c);
                component.set('v.oValueString', mr.MatchValue__c);
                
                //Fire Event
                var appEvent = $A.get("e.c:Monocle_PredictionStatus");
                appEvent.setParams({ "recordId" : component.get("v.recordId"), 
                                    "title" : component.get('v.inputTitle'), 
                                    "completed" : mr.Completed__c, 
                                    "value" : mr.MatchValue__c});
                appEvent.fire();
                
            }
        });
        $A.enqueueAction(action);
    },
})