// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load notification service
const rootPrefix = '..',
  openSTNotificationKlass = require(rootPrefix + '/index'),
  configStrategy = require(rootPrefix + '/test/config_strategy.json');

require(rootPrefix + '/lib/rabbitmq/connect');
require(rootPrefix + '/services/publish_event');

const getParams = function() {
  return {
    topics: ['events.transfer'],
    message: {
      kind: 'event_received',
      payload: {
        event_name: 'one event of st m',
        params: { id: 'hello...' },
        contract_address: 'address'
      }
    }
  };
};

const getConnection = async function() {
  return await openSTNotificationKlass.getInstance(configStrategy);
};

describe('Publishing to rabbitMq', async function() {
  it('should return promise', async function() {
    // Create connection.
    let connection = await getConnection();

    let params = getParams(),
      response = connection.publishEvent.perform(params);

    assert.typeOf(response, 'Promise');
  });

  it('should fail when empty params are passed', async function() {
    let params = {},
      connection = await getConnection(),
      response = await connection.publishEvent.perform(params);

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when no params are passed', async function() {
    let connection = await getConnection(),
      response = await connection.publishEvent.perform();

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params dont have topics', async function() {
    let params = getParams();
    delete params['topics'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);

    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params dont have message', async function() {
    let params = getParams();
    delete params['message'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message dont have kind', async function() {
    let params = getParams();
    delete params['message']['kind'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message dont have payload', async function() {
    let params = getParams();
    delete params['message']['payload'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have event_name', async function() {
    let params = getParams();
    delete params['message']['payload']['event_name'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have params', async function() {
    let params = getParams();
    delete params['message']['payload']['params'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params message payload dont have contract_address', async function() {
    let params = getParams();
    delete params['message']['payload']['contract_address'];

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when unsupported kind is passed', async function() {
    let params = getParams();
    params['message']['kind'] = 'abcd';

    let connection = await getConnection(),
      response = await connection.publishEvent.perform(params);
    assert.equal(response.isSuccess(), false);
  });
});
