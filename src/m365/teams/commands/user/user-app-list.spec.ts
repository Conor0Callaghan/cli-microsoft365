import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { pid } from '../../../../utils/pid';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./user-app-list');

describe(commands.USER_APP_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent,
      pid.getProcessName
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.USER_APP_LIST), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the userId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        userId: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both userId and userName are not provided.', async () => {
    const actual = await command.validate({
      options: {
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the userName is not a valid UPN.', async () => {
    const actual = await command.validate({
      options: {
        userName: "no-an-email"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the both userId and userName are provided.', async () => {
    const actual = await command.validate({
      options: {
        userId: '15d7a78e-fd77-4599-97a5-dbb6372846c6',
        userName: "admin@contoso.com"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the input is correct (userId)', async () => {
    const actual = await command.validate({
      options: {
        userId: '15d7a78e-fd77-4599-97a5-dbb6372846c6'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when the input is correct (userName)', async () => {
    const actual = await command.validate({
      options: {
        userName: "admin@contoso.com"
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('list apps from the catalog for the specified user (userId)', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/5c705288-ed7f-44fc-af0a-ac164419901c/teamwork/installedApps?$expand=teamsAppDefinition`) {
        return Promise.resolve({
          "value": [
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
              "teamsAppDefinition": {
                "id": "MzT1NWIxZjktODUwNy00ZjU3LWLmNDktZGI5YXRiNGMyZWRkIyMxLjAuMS4wIyNQpWJsaXNoZDQ=",
                "teamsAppId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
                "displayName": "Whiteboard",
                "version": "1.0.5",
                "publishingState": "published",
                "shortDescription": "Use Microsoft Whiteboard to collaborate, visualize ideas, and work creatively",
                "description": "Create a new whiteboard and collaborate with others in real time.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            },
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
              "teamsAppDefinition": {
                "id": "MoT1NVIxZjktODUwNy033ZjU3LWLmNDktZGI5YXTiNGMyZWRkIyMxLjAuMS4wIyNQpWJsqXNoZLQ=",
                "teamsAppId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
                "displayName": "Evernote",
                "version": "1.0.1",
                "publishingState": "published",
                "shortDescription": "Capture, organize, and share notes",
                "description": "Unlock the power of teamwork—collect, organize and share the information, documents and ideas you encounter every day.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        userId: '5c705288-ed7f-44fc-af0a-ac164419901c'
      }
    } as any);
    assert(loggerLogSpy.calledWith([
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
        "appId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
        "displayName": "Whiteboard",
        "version": "1.0.5"
      },
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
        "appId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
        "displayName": "Evernote",
        "version": "1.0.1"
      }
    ]));
  });

  it('list apps from the catalog for the specified user (userName)', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/5c705288-ed7f-44fc-af0a-ac164419901c/teamwork/installedApps?$expand=teamsAppDefinition`) {
        return Promise.resolve({
          "value": [
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
              "teamsAppDefinition": {
                "id": "MzT1NWIxZjktODUwNy00ZjU3LWLmNDktZGI5YXRiNGMyZWRkIyMxLjAuMS4wIyNQpWJsaXNoZDQ=",
                "teamsAppId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
                "displayName": "Whiteboard",
                "version": "1.0.5",
                "publishingState": "published",
                "shortDescription": "Use Microsoft Whiteboard to collaborate, visualize ideas, and work creatively",
                "description": "Create a new whiteboard and collaborate with others in real time.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            },
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
              "teamsAppDefinition": {
                "id": "MoT1NVIxZjktODUwNy033ZjU3LWLmNDktZGI5YXTiNGMyZWRkIyMxLjAuMS4wIyNQpWJsqXNoZLQ=",
                "teamsAppId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
                "displayName": "Evernote",
                "version": "1.0.1",
                "publishingState": "published",
                "shortDescription": "Capture, organize, and share notes",
                "description": "Unlock the power of teamwork—collect, organize and share the information, documents and ideas you encounter every day.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            }
          ]
        });
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/users/${encodeURIComponent("admin@contoso.com")}/id`) {
        return Promise.resolve({ "value": "5c705288-ed7f-44fc-af0a-ac164419901c" });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        userName: 'admin@contoso.com'
      }
    } as any);
    assert(loggerLogSpy.calledWith([
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
        "appId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
        "displayName": "Whiteboard",
        "version": "1.0.5"
      },
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
        "appId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
        "displayName": "Evernote",
        "version": "1.0.1"
      }
    ]));
  });

  it('list apps from the catalog for the specified user (debug)', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/5c705288-ed7f-44fc-af0a-ac164419901c/teamwork/installedApps?$expand=teamsAppDefinition`) {
        return Promise.resolve({
          "value": [
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
              "teamsAppDefinition": {
                "id": "MzT1NWIxZjktODUwNy00ZjU3LWLmNDktZGI5YXRiNGMyZWRkIyMxLjAuMS4wIyNQpWJsaXNoZDQ=",
                "teamsAppId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
                "displayName": "Whiteboard",
                "version": "1.0.5",
                "publishingState": "published",
                "shortDescription": "Use Microsoft Whiteboard to collaborate, visualize ideas, and work creatively",
                "description": "Create a new whiteboard and collaborate with others in real time.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            },
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
              "teamsAppDefinition": {
                "id": "MoT1NVIxZjktODUwNy033ZjU3LWLmNDktZGI5YXTiNGMyZWRkIyMxLjAuMS4wIyNQpWJsqXNoZLQ=",
                "teamsAppId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
                "displayName": "Evernote",
                "version": "1.0.1",
                "publishingState": "published",
                "shortDescription": "Capture, organize, and share notes",
                "description": "Unlock the power of teamwork—collect, organize and share the information, documents and ideas you encounter every day.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        userId: '5c705288-ed7f-44fc-af0a-ac164419901c',
        debug: true
      }
    } as any);
    assert(loggerLogSpy.calledWith([
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
        "appId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
        "displayName": "Whiteboard",
        "version": "1.0.5"
      },
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
        "appId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
        "displayName": "Evernote",
        "version": "1.0.1"
      }
    ]));
  });

  it('list apps from the catalog for the specified user (json)', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/5c705288-ed7f-44fc-af0a-ac164419901c/teamwork/installedApps?$expand=teamsAppDefinition`) {
        return Promise.resolve({
          "value": [
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
              "teamsAppDefinition": {
                "id": "MzT1NWIxZjktODUwNy00ZjU3LWLmNDktZGI5YXRiNGMyZWRkIyMxLjAuMS4wIyNQpWJsaXNoZDQ=",
                "teamsAppId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
                "displayName": "Whiteboard",
                "version": "1.0.5",
                "publishingState": "published",
                "shortDescription": "Use Microsoft Whiteboard to collaborate, visualize ideas, and work creatively",
                "description": "Create a new whiteboard and collaborate with others in real time.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            },
            {
              "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
              "teamsAppDefinition": {
                "id": "MoT1NVIxZjktODUwNy033ZjU3LWLmNDktZGI5YXTiNGMyZWRkIyMxLjAuMS4wIyNQpWJsqXNoZLQ=",
                "teamsAppId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
                "displayName": "Evernote",
                "version": "1.0.1",
                "publishingState": "published",
                "shortDescription": "Capture, organize, and share notes",
                "description": "Unlock the power of teamwork—collect, organize and share the information, documents and ideas you encounter every day.",
                "lastModifiedDateTime": null,
                "createdBy": null
              }
            }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: {
        userId: '5c705288-ed7f-44fc-af0a-ac164419901c',
        output: 'json'
      }
    } as any);
    assert(loggerLogSpy.calledWith([
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyMwOTg5ZjNhNC0yNWY3LTQ2YWItYTNjMC1iY2MwZWNmY2E2ZWY=",
        "teamsAppDefinition": {
          "id": "MzT1NWIxZjktODUwNy00ZjU3LWLmNDktZGI5YXRiNGMyZWRkIyMxLjAuMS4wIyNQpWJsaXNoZDQ=",
          "teamsAppId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef",
          "displayName": "Whiteboard",
          "version": "1.0.5",
          "publishingState": "published",
          "shortDescription": "Use Microsoft Whiteboard to collaborate, visualize ideas, and work creatively",
          "description": "Create a new whiteboard and collaborate with others in real time.",
          "lastModifiedDateTime": null,
          "createdBy": null
        },
        "appId": "0989f3a4-25f7-46ab-a3c0-bcc0ecfca6ef"
      },
      {
        "id": "NWM3MDUyODgtZWQ3Zi00NGZjLWFmMGEtYWMxNjQ0MTk5MDFjIyM5OTlhNTViOS00OTFlLTQ1NGEtODA4Yy1jNzVjNWM3NWZjMGE=",
        "teamsAppDefinition": {
          "id": "MoT1NVIxZjktODUwNy033ZjU3LWLmNDktZGI5YXTiNGMyZWRkIyMxLjAuMS4wIyNQpWJsqXNoZLQ=",
          "teamsAppId": "999a55b9-491e-454a-808c-c75c5c75fc0a",
          "displayName": "Evernote",
          "version": "1.0.1",
          "publishingState": "published",
          "shortDescription": "Capture, organize, and share notes",
          "description": "Unlock the power of teamwork—collect, organize and share the information, documents and ideas you encounter every day.",
          "lastModifiedDateTime": null,
          "createdBy": null
        },
        "appId": "999a55b9-491e-454a-808c-c75c5c75fc0a"
      }
    ]));
  });

  it('correctly handles error while listing teams apps', async () => {
    sinon.stub(request, 'get').callsFake(() => {
      return Promise.reject('An error has occurred');

    });

    await assert.rejects(command.action(logger, { options: { userId: '5c705288-ed7f-44fc-af0a-ac164419901c' } } as any), new CommandError('An error has occurred'));
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});