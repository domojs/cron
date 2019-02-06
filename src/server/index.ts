import * as akala from '@akala/server';
import { AssetRegistration } from '@akala-modules/core';
import { EventEmitter } from 'events';
import * as lifttt from '@domojs/lifttt';
import { getTarget } from '../client/date';
import { v4 as uuid } from 'uuid';

var timers: { [key: string]: { callback: Function, timeout?: NodeJS.Timer } } = {};

function intervaller(fields: { minute?: number, hour?: number, day?: number[], exceptions?: number[], date?: number | 'last', month?: number, lat?: number, lng?: number, tz?: number }, callback:
    (fields: { minute?: number, hour?: number, day?: number[], exceptions?: number[], date?: number | 'last', month?: number, lat?: number, lng?: number, tz?: number }) => void, id?: string)
{
    if (!id)
    {
        timers[id = uuid()] = { callback: callback };
        process.on('exit', function ()
        {
            clearTimeout(timers[id].timeout);
            delete timers[id];
        });
    }

    var timeOut = setTimeout(function ()
    {
        akala.logger.verbose(getTarget(fields));
        akala.logger.verbose(getTarget(fields).getTime());
        akala.logger.verbose(new Date().getTime());
        intervaller(fields, callback, id);
        callback(fields);
    }, getTarget(fields).getTime() - new Date().getTime());

    timers[id].timeout = timeOut;

    return id;
}


akala.injectWithName(['$isModule', '$master', '$worker'], function (isModule: akala.worker.IsModule, master: akala.worker.MasterRegistration, worker: EventEmitter)
{
    if (isModule('@domojs/cron'))
    {
        worker.on('ready', function ()
        {
            // Called when all modules have been initialized

        });

        akala.injectWithNameAsync(['$agent.api/lifttt'], async function (client)
        {
            var cl = akala.api.jsonrpcws(lifttt.channel).createClient(client, {
                executeAction(action)
                {
                },
                executeCondition(condition)
                {
                },
                stopTrigger(trigger)
                {
                    clearTimeout(timers[trigger.id].timeout);
                },
                executeTrigger(trigger)
                {
                    akala.logger.info(`executing trigger ${JSON.stringify(trigger.params)}`)
                    var id = intervaller(trigger.params, function ()
                    {
                        akala.logger.info(`trigger ${JSON.stringify(trigger.params)}`)
                        server.trigger({ id: id, data: { ...trigger.params, date: new Date().toISOString() } })
                    });
                    return id;
                }
            });
            var server = cl.$proxy();
            await server.registerChannel({ name: 'cron', icon: 'clock' })
            await server.registerTrigger({
                "name": "every day", fields: [
                    { "name": "hour", "displayName": "Heure", type: 'int' },
                    { "name": "minute", "displayName": "Minute", type: 'int' }]
            });
            await server.registerTrigger({
                "name": "every sun rise/set",
                fields: [
                    { "name": "lat", "displayName": "Latitude", type: 'string' },
                    { "name": "lng", "displayName": "Longitude", type: 'string' },
                    { "name": "tz", "displayName": "Fuseau horaire", type: 'int' },
                    { "name": "rise/set", "displayName": "Coucher/Lever", type: 'string' },
                    { name: "day", displayName: "Jour", type: 'int[]' }
                ]
            });
            await server.registerTrigger({
                "name": "every hour", fields: [
                    { "name": "minute", "displayName": "Minute", type: 'int' }]
            });
            await server.registerTrigger({
                "name": "every week", fields: [
                    { "name": "hour", "displayName": "Heure", type: 'int' },
                    { "name": "minute", "displayName": "Minute", type: 'int' },
                    { "name": "day", "displayName": "Jour", type: 'int[]' }]
            });
            await server.registerTrigger({
                "name": "every month", fields: [
                    { "name": "hour", "displayName": "Heure", type: 'int' },
                    { "name": "minute", "displayName": "Minute", type: 'int' },
                    { "name": "date", "displayName": "Jour", type: 'int[]' }]
            });
            await server.registerTrigger({
                "name": "every year", fields: [
                    { "name": "hour", "displayName": "Heure", type: 'int' },
                    { "name": "minute", "displayName": "Minute", type: 'int' },
                    { "name": "day", "displayName": "Jour", type: 'int[]' },
                    { "name": "month", "displayName": "Mois", type: 'int' }]
            });
        })

        akala.injectWithNameAsync([AssetRegistration.name], function (va: AssetRegistration)
        {
            // va.register('/js/tiles.js', require.resolve('../tile'));
            // va.register('/js/routes.js', require.resolve('../routes'));
        });

    }
})()