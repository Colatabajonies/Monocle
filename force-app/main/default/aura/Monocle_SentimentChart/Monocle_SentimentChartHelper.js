({ 
    loadChart : function(component, event, helper)
    {
       //alert('loading chart');
       var firstValue = [168,170,178,190,203,276,408,547,675,734];
        var secondValue = [40,20,10,16,24,38,74,167,508,784];
                 
        var el = component.find('lineChart').getElement();
        var ctx = el.getContext('2d');
        
        var varMyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels:  ['00:00:00'], //['00:00:00', '00:00:12', '00:00:45', '00:01:00', '00:01:30', '00:02:20', '00:04:22'],
				datasets: [{
					label: 'Customer',
					backgroundColor: '#FB6284',
					borderColor: '#FB6284',
					data: [0], //[0,1,2,3,2,1,0,1,2],
					fill: false,
				}, {
					label: 'Agent',
					fill: false,
					backgroundColor: '#36A2EB',
					borderColor: '#36A2EB',
					data: [0], //[0,-1,0,1,2,3,4,2,1],
				}]
			},
			options: {
				responsive: true,
				title: {
					display: false,
					text: 'Real-time Sentiment'
				},
				tooltips: {
					mode: 'index',
					intersect: false,
				},
				hover: {
					mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{ticks: {display: false}}], //this will remove only the label
                	x: {
						display: false,
						scaleLabel: {
							display: false,
							labelString: 'Elapsed time'
						}
					},
					y: {
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Value'
						}
					}
				}
			}
        });
        
        component.set("v.myChart", varMyChart); 
    },
    
    refreshResults : function(component, event, helper)
    {
        //Refresh the data
        var action = component.get('c.getSentimentChartData'); 
        action.setParams({
            "recordId" : component.get('v.recordId'),
            "speaker" : event ? event.getParam("speaker") : null,
            "utterance" : event ? event.getParam("utterance") : null,
            "payload" : event ?  event.getParam("payload") : null
        });
        action.setCallback(this, function(a){
            var state = a.getState(); // get the response state
            if(state == 'SUCCESS' && a.getReturnValue() != null) {
                var myResults = a.getReturnValue();
                
                var varMyChart = component.get("v.myChart");
                varMyChart.data.labels = myResults.labels;
                varMyChart.data.datasets[0].data = myResults.cdata;
                varMyChart.data.datasets[1].data = myResults.adata;
                varMyChart.update();
            }
        });
        $A.enqueueAction(action);
    },
})