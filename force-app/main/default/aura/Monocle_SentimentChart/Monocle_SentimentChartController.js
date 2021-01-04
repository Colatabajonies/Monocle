({
	afterScriptsLoaded : function(component, event, helper) 
    {
        if (!component.get('v.recordId') && component.get('v.contextRecordId'))
        {
            component.set('v.recordId', component.get('v.contextRecordId'));
        }
        
        //Try to load the Einstein Insight
        if (component.get('v.recordId'))
        {
            helper.loadChart(component,event, helper);
            helper.refreshResults(component, null, helper);
        }
	},
    
    doRefresh : function(component, event, helper)
    {
        //Only run for matching records
        if (component.get('v.recordId') && event.getParam("type").toLowerCase() == 'sentiment' && component.get('v.recordId').toLowerCase() == event.getParam("recordId").toLowerCase())
        {
            helper.refreshResults(component, event, helper);
        }
    }
})