({
	doInit : function(component, event, helper) 
    {
        if (!component.get('v.recordId') && component.get('v.contextRecordId'))
        {
            component.set('v.recordId', component.get('v.contextRecordId'));
        }
        
        //Try to load the Einstein Insight
        if (component.get('v.recordId'))
        {
            helper.loadInsight(component, event, helper);
            helper.checkActive(component, event, helper);
        }
	},
    
    doRefresh : function(component, event, helper) 
    {
        //Only run for matching records
        if (component.get('v.recordId').toLowerCase() != event.getParam("recordId").toLowerCase())
        {
            return;
        }
        
        var evtType = event.getParam("type").toLowerCase();
        var autoRun = component.get('v.matchType') == 'Keyword' || component.get('v.matchType') == 'RegEx';
        if (!component.get('v.completed') && (autoRun|| evtType == component.get('v.matchType').toLowerCase()))
        {
            helper.checkprediction(component, event, helper);
        }
    },
    
    checkChange : function(component, event, helper)
    {
        var newVal = component.get('v.strValue');
        
        if (!newVal)
        {
            component.set('v.completed', false);
            component.set('v.oValueBool', false);
            component.set('v.strValue', '');
            component.set('v.oValueString', '');
            component.set('v.utterance', '');
        }
        else
        {
            component.set('v.completed', true);
            component.set('v.oValueBool', true);
            component.set('v.oValueString', newVal);
            component.set('v.utterance', '(Manually updated by agent)');
        }
        
        
        helper.updateItem(component, event, helper);
    },
    
    setField : function(component, event, helper)
    {
        component.set('v.completed', true);
        component.set('v.oValueBool', true);
        component.set('v.strValue', 'MARKED COMPLETE');
        component.set('v.oValueString', 'MARKED COMPLETE');
        component.set('v.utterance', 'MARKED COMPLETE');
        
        helper.updateItem(component, event, helper);
    },
    
    clearField : function(component, event, helper)
    {
        //Clear Stuff
        component.set('v.completed', false);
        component.set('v.oValueBool', false);
        component.set('v.strValue', '');
        component.set('v.oValueString', '');
        component.set('v.utterance', '');
        
        helper.updateItem(component, event, helper);
    },
})