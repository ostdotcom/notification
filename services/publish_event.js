"use strict";

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , util = require(rootPrefix + '/lib/util')
  , rmqId = 'rmq1'
;

const publishEvent = {

  perform: async function(params) {

    var oThis = this;

    var r = await oThis.validateParams(params);

    if(r.isFailure()){
      Promise.resolve(r);
    }

    var validatedParams = r.data
      , ex = 'topic_events'
      , key = validatedParams['topic']
      , message = validatedParams['message']
      , msgString = JSON.stringify(message)
      , conn = await rabbitmqConnection.get(rmqId);

    if(conn){
      conn.createChannel(function(err, ch) {

        ch.assertExchange(ex, 'topic', {durable: true});
        ch.publish(ex, key, new Buffer(msgString));
        console.log(" [x] Sent %s:'%s'", key, message);

        ch.close();

      });
    } else {
      util.saveUnpublishedMessages(msgString);

    }

  },

  validateParams: function (params) {

    var validatedParams = {};

    if(!params['topic'] || !params['message']){
      Promise.resolve(responseHelper.error('ost_q_m_s_pe_1', 'invalid parameters'));
    }

    validatedParams['topic'] = params['topic'];

    validatedParams['message'] = {};

    var message = params['message'];

    if(!message['kind'] || !message['payload']){
      Promise.resolve(responseHelper.error('ost_q_m_s_pe_2', 'invalid parameters'));
    }

    if(message['kind'] == 'event_received'){

      if(!message['payload']['event_name'] ||
        !message['payload']['params'] ||
        !message['payload']['contract address']
      ){
        Promise.resolve(responseHelper.error('ost_q_m_s_pe_3', 'invalid payload for kind event_received'));
      }

    } else if(params['kind'] == 'transaction_initiated'){

      if(!message['payload']['contract_name'] ||
        !message['payload']['contract address'] ||
        !message['payload']['method'] ||
        !message['payload']['params'] ||
        !message['payload']['transaction_hash'] ||
        !message['payload']['uuid']
      ){
        Promise.resolve(responseHelper.error('ost_q_m_s_pe_4', 'invalid payload for kind event_received'));
      }

    } else if(params['kind'] == 'transaction_mined'){

      if(!message['payload']['transaction_hash']){
        Promise.resolve(responseHelper.error('ost_q_m_s_pe_5', 'invalid payload for kind event_received'));
      }

    } else {
      Promise.resolve(responseHelper.error(
        'ost_q_m_s_pe_6',
        'unsupported kind transfered. supported are event_received,transaction_initiated,transaction_mined')
      );
    }

    validatedParams['message']['kind'] = message['kind'];
    validatedParams['message']['payload'] = message['payload'];

    return Promise.resolve(responseHelper.successWithData(validatedParams));
  }

};

module.exports = publishEvent;