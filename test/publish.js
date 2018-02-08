// Load external packages
const chai = require('chai')
  , assert = chai.assert;

// Load cache service
const rootPrefix = ".."
  , publishEvent = require(rootPrefix + '/services/publish_event')
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
;

const getParams = function () {
  return {
    topics:["events.transfer"],
    message: {
      kind: "event_received",
      payload: {
        event_name: "one event of st m",
        params: {id: "hello..."},
        contract_address: "address"
      }
    }
  };
};

describe('publish to rabbitmq', async function() {

  it('should return promise', async function() {

    await rabbitmqConnection.get('rmq1');

    var params = getParams()
      , response = publishEvent.perform(params);

    assert.typeOf(response, 'Promise');
  });

  it('should fail when empty params are passed', async function() {
    var params = {}
      , response = await publishEvent.perform(params);

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when no params are passed', async function() {
    var response = await publishEvent.perform();

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params dont have topics', async function() {
    var params = getParams();
    delete params['topics'];

    var response = await publishEvent.perform(params);

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params dont have message', async function() {
    var params = getParams();
    delete params['message'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message dont have kind', async function() {
    var params = getParams();
    delete params['message']['kind'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message dont have payload', async function() {
    var params = getParams();
    delete params['message']['payload'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have event_name', async function() {
    var params = getParams();
    delete params['message']['payload']['event_name'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have params', async function() {
    var params = getParams();
    delete params['message']['payload']['params'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have contract_address', async function() {
    var params = getParams();
    delete params['message']['payload']['contract_address'];

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when unsupported kind is passed', async function() {
    var params = getParams();
    params['message']['kind'] = 'abcd';

    var response = await publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

});