import 'source-map-support/register'
import debug=require('debug');
debug.enable('domojs*')
import * as akala from '@akala/server';

akala.register('$isModule', function () { return false });

import * as self from '../server/scrapper';

self.setLanguage('fr');

// var media: self.DbTvShow = { name: 'altered carbon', type: 'video', episode:1, season:1, path:'file://///ana.dragon-angel.fr/videos/tv series/altered carbon/altered carbon - s1 e1.mkv' } as any;
// self.tvdbScrapper('video', media).then(() =>
// {
//     console.log(media);
// });

var media: self.DbTvShow = { name: 'Kiss x', type: 'video', episode:2, path:'' } as any;
self.tvdbScrapper('video', media).then(() =>
{
    console.log(media);
});