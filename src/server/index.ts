import * as akala from '@akala/server';
import { Client, Connection } from '@akala/json-rpc-ws';
import { scrapper } from '@domojs/media';
import { DbTvShow, tvdbScrapper, setLanguage } from './scrapper';
export * from './scrapper';

akala.injectWithNameAsync(['$isModule', '$config.@domojs/media-tmdbscrapper', '$agent.media'], function (isModule: akala.worker.IsModule, config: PromiseLike<any>, client: Client<Connection>)
{
    if (isModule('@domojs/media-tmdbscrapper'))
    {
        if (config)
            config.then(function (config)
            {
                if (config && config.language)
                    setLanguage(config.language);
            });

        var s = akala.api.jsonrpcws(scrapper).createClient(client)({
            scrap: function (media: DbTvShow)
            {
                return tvdbScrapper(media.type, media).then((newPath) =>
                {
                    media['optimizedPath'] = newPath;
                    return media;
                });
            }
        }).$proxy();
        s.register({ type: 'video', priority: 20 });
    }
});