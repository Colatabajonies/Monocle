public class Monocle_ListenerHelper 
{
    @AuraEnabled
    public static Einstein_Insight__c checkPrediction(string recordId, string title, string utteranceText, string speaker, string matchType, string matchValue, string speakerMatch, einsteinplay.Einstein_PredictionResult payload)
    {
        if (speaker.toLowerCase() == 'enduser')
        {
            speaker = 'Customer';
        }
        if (String.isBlank(utteranceText))
        {
            return null;
        }
        
        Einstein_Insight__c retVal;
        
        if (String.isBlank(recordId))
        {
            retVal = new Einstein_Insight__c();
            retVal.Completed__c = false;
            retVal.Title__c = title;
        }
        else //there is a recordId
        {
            retVal = loadInsight(recordId, title);
            if (retval == null)
            {
                retVal = new Einstein_Insight__c();
                retVal.Completed__c = false;
                retVal.Title__c = title;
                if (recordId.startsWith('0LQ'))
                {
                    retVal.Voice_Call__c  = recordId;
                }
                else if (recordId.startsWith('570'))
                {
                    retVal.Chat_Transcript__c = recordId;
                }
                
            }
                        
            //Return if already completed
            if (retVal.Completed__c)
            {
                return retVal;
            }
        }
        
        //Check Keywords
        if ((matchType.toLowerCase() == 'keyword' || matchType.toLowerCase() == 'regex' ) && 
            (speaker.toLowerCase() == speakerMatch.toLowerCase() || speakerMatch.toLowerCase() == 'agent or customer')
           )
        {
            String keywordMatch = checkKeywordMatch(utteranceText, matchValue, matchType);
                if (String.isNotBlank(keywordMatch))
                {
                    retVal.MatchValue__c = keywordMatch;
                    retVal.Completed__c = true;
                    retVal.Utterance__c = utteranceText;
                    retVal.Speaker__c = speaker;
                }
        }
        
        //Check intents
        else if (matchType.toLowerCase() == 'intent' && 
                 (speaker.toLowerCase() == speakerMatch.toLowerCase() || speakerMatch.toLowerCase() == 'agent or customer')
                )
        {
            for (einsteinplay.Einstein_Probability cI : payload.probabilities)
            {
                //system.debug('prob:' + cI.probability + ' tol:' + tolerance);
                If (cI.probability * 100 >= 65 && cI.label.toLowerCase() == matchValue.toLowerCase())
                {
                    retVal.Completed__c = true;
                    retVal.Utterance__c = utteranceText;
                    retVal.MatchValue__c = utteranceText;
                    retVal.Intent__c = cI.label;
                    retVal.Intent_Confidence__c = cI.probability;
                    retVal.Speaker__c = speaker;
                    break;
                }
            }
        }
        
        else if (matchType.toLowerCase() == 'named entity' && 
                 (speaker.toLowerCase() == speakerMatch.toLowerCase() || speakerMatch.toLowerCase() == 'agent or customer')
                )
        {
            system.debug('inside lookp for NER');
            for (einsteinplay.Einstein_Probability cI : payload.probabilities)
            {
                if (cI.probability * 100 >= 65 && 
                    matchValue.toLowerCase() == cI.label.toLowerCase()
                   )
                {
                    retVal.Completed__c = true;
                    retVal.Utterance__c = utteranceText;
                    retVal.Speaker__c = speaker;
                    retVal.MatchValue__c = cI.token;
                    retVal.Entities__c = matchValue;
                    break;
                }
            }
        }
        
        if (String.isNotBlank(recordId))
        {
            UPSERT retVal;
        }
                
        return retVal;
    }
    
    @AuraEnabled
    public static Einstein_Insight__c loadInsight(string recordId, string title)
    {
        List<Einstein_Insight__c> retVals;
        Einstein_Insight__c retVal;
        if (recordId.startsWith('0LQ'))
        {
            retVals = new List<Einstein_Insight__c>([SELECT Id, Completed__c, MatchValue__c, Utterance__c FROM Einstein_Insight__c WHERE Voice_Call__c =: recordId AND Title__c =: title LIMIT 1]);
        }
        else if (recordId.startsWith('570'))
        {
            retVals = new List<Einstein_Insight__c>([SELECT Id, Completed__c, MatchValue__c, Utterance__c FROM Einstein_Insight__c WHERE Chat_Transcript__c =: recordId AND Title__c =: title LIMIT 1]);
        }
        
        if (retVals.size() > 0)
        {
            retVal = retVals[0];
        } 
        return retVal;
    }
    
    @AuraEnabled
    public static Boolean checkIsActive(string recordId)
    {
        if (recordId.startsWith('0LQ'))
        {
            VoiceCall  vc = [SELECT Id, CallEndDateTime,CallDisposition,CallAcceptDateTime  FROM VoiceCall  WHERE ID=: recordId];
            if (vc.CallEndDateTime != null)
            {
                //The Voice Call is over
                return false;
            }
        }
        else if (recordId.startsWith('570'))
        {
            LiveChatTranscript  ct = [SELECT Id, Status  FROM LiveChatTranscript  WHERE ID=: recordId];
            if (ct.Status != 'InProgress')
            {
                //The Chat is over
                return false;
            }
        }
        
        return true;
    }
    
    @AuraEnabled
    public static Einstein_Insight__c updateInsight(string recordId, string title, boolean completed, string matchValue, string utterance)
    {
        Einstein_Insight__c retVal = loadInsight(recordId, title);
        if (retVal != null)
        {
            retVal.Completed__c = completed;
            retVal.MatchValue__c = matchValue;
            retVal.Utterance__c = utterance;
            UPDATE retVal;
        }
        return retVal;
    }
    
    private static string checkKeywordMatch(string utteranceText, string keywordString, string extractionType)
    {
        //See if regex is set
        if (extractionType == 'RegEx')
        {
            try
            {
                Matcher m = Pattern.compile(keywordString).matcher(utteranceText);
                //system.debug('Attempting to do regex:' + keywordString + ' to ' + utteranceText);
                while (m.find()) 
                {
                    //system.debug('Found: '+ m.group());
                    return m.group();
                }
            }
            catch(exception ex)
            {
                system.debug('Error:' + ex.getMessage());
            }
        }
        else //value match
        {
            //Iterate through Pipe List
            for (string matchString : keywordString.split('\\|'))
            {
                if (utteranceText.toLowerCase().contains(matchString.toLowerCase()))
                {
                    return matchString;
                }
                else if (keywordString.toLowerCase() == '{!agentname}' && utteranceText.toLowerCase().contains(UserInfo.getFirstName().toLowerCase()))
                {
                    return UserInfo.getFirstName();
                }
            }
        }
        return null;
    }
    
    @AuraEnabled
    public static einsteinplay.Einstein_PredictionResult checkIntent(string utteranceText, string iModelId)
    {
        system.debug(utteranceText + ' ' + iModelId);
        einsteinplay.Einstein_PredictionService serviceIntent = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.INTENT);
        einsteinplay.Einstein_PredictionResult results = serviceIntent.predictIntent(iModelId, utteranceText, 5, '');
        return results;
    }
    
    @AuraEnabled
    public static einsteinplay.Einstein_PredictionResult checkSentiment(string utteranceText, string sModelId)
    {
        einsteinplay.Einstein_PredictionService serviceSentiment = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.SENTIMENT);
        return serviceSentiment.predictSentiment(sModelId, utteranceText, 3, '');
    }
    
    @AuraEnabled
    public static einsteinplay.Einstein_PredictionResult checkNER(string utteranceText)
    {
        einsteinplay.Einstein_PredictionService serviceNER = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.NER);
        return serviceNER.predictNER('ENTITIES', utteranceText, 5, '');
    }
    
    @AuraEnabled
    public static SentimentChartData getSentimentChartData(String recordId, string speaker, string utterance, einsteinplay.Einstein_PredictionResult payload)
    {
        if (String.isNotBlank(speaker) && speaker.toLowerCase() == 'enduser')
        {
            speaker = 'Customer';
        }
        
        Einstein_Insight__c newSentiment = new Einstein_Insight__c();
        
        if (String.isNotBlank(utterance))
        {
            newSentiment.Sentiment__c = payload.probabilities[0].label;
            newSentiment.Sentiment_Confidence__c = integer.valueOf(100 * payload.probabilities[0].probability);
            newSentiment.Speaker__c = speaker;
        }
        
        List<Einstein_Insight__c> retVals;
        if (recordId.startsWith('0LQ'))
        {
            if (String.isNotBlank(utterance))
            {
                newSentiment.Voice_Call__c = recordId;
                //get the created date of the voice call
                VoiceCall vc = [SELECT ID, CreatedDate FROM VoiceCall WHERE Id=: recordId LIMIT 1];
                newSentiment.ParentCreationDate__c = vc.CreatedDate;
                INSERT newSentiment;
            }
            retVals = new List<Einstein_Insight__c>([SELECT Id, CreatedDate, Sentiment__c, Sentiment_Confidence__c, Speaker__c, ParentCreationDate__c FROM Einstein_Insight__c WHERE Voice_Call__c =: recordId AND Sentiment__c  !=: '' ORDER BY CreatedDate ASC]);
        }
        else if (recordId.startsWith('570'))
        {
            if (String.isNotBlank(utterance))
            {
                newSentiment.Chat_Transcript__c = recordId;
                LiveChatTranscript ct = [SELECT ID, CreatedDate FROM LiveChatTranscript WHERE Id=: recordId LIMIT 1];
                newSentiment.ParentCreationDate__c = ct.CreatedDate;
                INSERT newSentiment;                
            }
            retVals = new List<Einstein_Insight__c>([SELECT Id, CreatedDate, Sentiment__c, Sentiment_Confidence__c, Speaker__c, ParentCreationDate__c FROM Einstein_Insight__c WHERE Chat_Transcript__c =: recordId AND Sentiment__c  !=: '' ORDER BY CreatedDate ASC]);
        }

        
        List<Integer> cSentiment = new List<Integer>();
        List<Integer> aSentiment = new List<Integer>();
        List<String> labels = new List<String>();
        labels.add('00:00:00');
        cSentiment.add(0);
        aSentiment.add(0);
        
        for (Einstein_Insight__c resp : retVals)
        {
            //labels.add(resp.ElapsedTime__c );
            Long milliseconds = resp.CreatedDate.getTime() - resp.ParentCreationDate__c.getTime();
            Long hours = milliseconds / 1000 / 60 / 60;
            milliseconds = milliseconds - (hours * 3600000);
            Long minutes = milliseconds / 1000 / 60;
            milliseconds = milliseconds - (minutes * 60000);
            Long seconds = milliseconds / 1000;

            labels.add((hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
            
            integer theValue = 0;
            if (resp.Sentiment__c == 'Positive') theValue = 1;
            else if (resp.Sentiment__c == 'Negative') theValue = -1;
            
            if (resp.Speaker__c == 'Agent')
            {
                cSentiment.add(cSentiment[cSentiment.size()-1]);
                aSentiment.add(aSentiment[aSentiment.size()-1] + theValue);
            }
            else
            {
                cSentiment.add(cSentiment[cSentiment.size()-1] + theValue);
                aSentiment.add(aSentiment[aSentiment.size()-1]);
            }
        }
        
        SentimentChartData retVal = new SentimentChartData();
        retVal.labels = labels;
        retVal.cdata = cSentiment;
        retVal.adata = aSentiment;
        return retVal;
    }
    
    public class SentimentChartData
    {
        @AuraEnabled
        public List<string> labels {get;set;}
        @AuraEnabled
        public List<Integer> adata {get;set;}
        @AuraEnabled
        public List<Integer> cdata {get;set;}
    }
}