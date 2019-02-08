import * as akala from '@akala/server';
import { Client, Connection } from '@akala/json-rpc-ws';
import { scrapper } from '@domojs/media';
import { DbTvShow, tmdbScrapper, setLanguage } from './scrapper';
export * from './scrapper';

akala.injectWithNameAsync(['$isModule', '$config.@domojs/media-tmdbscrapper', '$agent.api/media'], function (isModule: akala.worker.IsModule, config: any, client: Client<Connection>)
{
    if (isModule('@domojs/media-tmdbscrapper'))
    {
        if (config)
            if (config && config.language)
                setLanguage(config.language);

        var s = akala.api.jsonrpcws(scrapper).createClient(client, {
            scrap: function (media: DbTvShow)
            {
                return tmdbScrapper(media.type, media).then((newPath) =>
                {
                    if (newPath)
                        media.optimizedPath = newPath;
                    return media;
                });
            }
        }).$proxy();
        s.register({ type: 'video', priority: 20 });
    }
});