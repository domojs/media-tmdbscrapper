import 'source-map-support/register'
import debug=require('debug');
debug.enable('domojs*')
import * as akala from '@akala/server';
import * as mock from 'mock-require';
mock('@akala/server', akala);

akala.register('$isModule', function () { return false });

import * as self from '../server/scrapper';

self.setLanguage('fr');

// var media: self.DbTvShow = { name: 'altered carbon', type: 'video', episode:1, season:1, path:'file://///ana.dragon-angel.fr/videos/tv series/altered carbon/altered carbon - s1 e1.mkv' } as any;
// self.tvdbScrapper('video', media).then(() =>
// {
//     console.log(media);
// });

var media: self.DbTvShow = { name: 'Majin Tantei Nougami Neuro', displayName:'Majin Tantei Nougami Neuro - E18', type: 'video', episode:18, path:'', subType:'tvshow' } as any;
self.tmdbScrapper('video', media).then((newPath) =>
{
    media.optimizedPath=newPath;
    console.log(media);
});