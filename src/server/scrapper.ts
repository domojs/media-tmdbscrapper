import * as akala from '@akala/server';
import * as path from 'path'
import * as levenshtein from 'levenshtein';
import { MediaType, TVShow, Movie } from '@domojs/media';
import * as url from 'url';
const APIKEY = 'be3bc153ce74463263960789c93e29a9';
const log = akala.log('domojs:media:tmdbscrapper');


var http: akala.Http = akala.resolve('$http');

export interface DbTvShow extends TVShow
{
    tmdbid: number;
    episodeOverview: string;
    still: string;
}

export interface DbTvMovie extends Movie
{
    tmdbid: number;
    displayName: string;
    overview: string;
    still: string;
}

export function setLanguage(l: string)
{
    api.setLanguage(l);
}

namespace api
{
    export interface JWT
    {
        token: string;
    }
    var language = 'en'
    var currentJwt: JWT = { token: APIKEY };

    export function setLanguage(l: string)
    {
        language = l;
    }

    export interface PageResult<T>
    {
        page: number;
        results: T[];
        total_results: number;
        total_pages: number;
    }

    export type TmdbMedia = TmdbShow | TmdbMovie;

    export interface TmdbMedium
    {
        id: number;
        poster_path?: string;
        overview?: string;
        genre_ids: number[];
        backdrop_path?: string;
        popularity: number
        vote_average: number;
        vote_count: number;
    }

    export interface TmdbShow extends TmdbMedium
    {
        media_type: 'tv';
        first_air_date: string;
        origin_country: string[];
        original_language: string
        name: string;
        original_name: string;
    }

    export interface TmdbShowExtended extends TmdbShow
    {
        created_by: { id: number, name: string, gender: number, profile_path: string }[];
        episode_run_time: number[];
        genres: TmdbListItem[];
        homepage: string;
        in_production: boolean;
        languages: string[];
        last_air_date: string;
        networks: TmdbListItem[];
        number_of_episodes: number;
        number_of_seasons: number;
        production_companies: TmdbCompany[];
        seasons: TmdbSeason[];
        status: 'Returning Series' | 'Planned' | 'In Production' | 'Ended' | 'Canceled' | 'Pilot';
        type: 'Scripted Reality' | 'Documentaty' | 'News' | 'Talk Show' | 'Miniseries';
        alternative_titles?: { results: { iso_3166_1: string, title: string, type: string }[] };
    }

    export interface TmdbMovie extends TmdbMedium
    {
        adult: boolean;
        release_date?: string;
        original_title: string;
        media_type: 'movie';
        original_language: string;
        title: string;
        video: boolean;
    }

    export interface TmdbMovieExtended extends TmdbMovie
    {
        belongs_to_collection?: object;
        budget: number;
        genres: TmdbListItem[];
        homepage?: string;
        imdb_id?: string;
        production_companies: TmdbCompany[];
        production_countries: TmdbCountry[];
        status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled';
        tagline?: string;
    }

    export interface TmdbCountry
    {
        iso_639_1: string;
        name: string;
    }

    export interface TmdbCompany
    {
        name: string;
        id: number;
        logo_path?: string;
        origin_country: string;
    }

    export interface TmdbPerson 
    {
        profile_path?: string;
        adult: boolean;
        id: number;
        media_type: 'person'
        known_for: (TmdbMovie | TmdbShow)[];
    }

    export interface GenreResult
    {
        id: number;
        name: string;
    }

    export interface TmdbSeason
    {
        air_date: string;
        episodes_count: number;
        id: number;
        poster_path?: string;
        season_number: number;
    }

    export interface TmdbSeasonExtended extends TmdbSeason
    {
        _id: string;
        air_date: string;
        episodes: TmdbEpisode[];
        name: string;
        overview: string;
        id: number;
        poster_path?: string;
        season_number: number;
    }

    export interface TmdbImage
    {
        aspect_ratio: number;
        file_path: string;
        height: number;
        iso_639_1?: string;
        vote_average: number;
        vote_count: number;
        width: number;
    }

    export interface TmdbEpisode
    {
        air_date: Date;
        crew: { id: number, credit_id: string, name: string, department: string, job: string, profile_path?: string }[];
        episode_number: number;
        guest_stars: { id: number, name: string, credit_id: string, character: string, order: number, profile_path?: string }[];
        name: string;
        overview: string;
        id: number;
        production_code?: string;
        season_number: number;
        still_path?: string;
        vote_average: number;
        vote_count: number;
    }

    export interface TmdbListItem
    {
        id: number;
        name: string;
    }

    export function authenticate(): PromiseLike<JWT>
    {
        return Promise.resolve(null);
    }

    export function searchMediaByName(name: string, language?: string, jwt?: JWT)
    {
        return sendRequest<PageResult<TmdbMovie | TmdbPerson | TmdbShow>>('/3/search/multi', { query: name }, language, jwt);
    }

    export function getGenres(type: 'movie' | 'tv')
    {
        return sendRequest<{ genres: GenreResult[] }>('/3/genre/' + type + '/list');
    }

    export function getSerie(id: number, language?: string, jwt?: JWT)
    {
        return sendRequest<TmdbShowExtended>(`/3/tv/${id}`, { append_to_response: 'alternative_titles' }, language, jwt).then(tvshow =>
        {
            tvshow.media_type = 'tv'
            return tvshow;
        });
    }
    export function getMovie(id: number, language?: string, jwt?: JWT)
    {
        return sendRequest<TmdbMovieExtended>(`/3/movie/${id}`, { append_to_response: 'alternative_titles' }, language, jwt).then(tvshow =>
        {
            tvshow.media_type = 'movie'
            return tvshow;
        });
    }
    export function getSeason(id: number, seasonNumber: number, language?: string, jwt?: JWT)
    {
        return sendRequest<TmdbSeasonExtended>(`/3/tv/${id}/season/${seasonNumber}`, null, language, jwt);
    }

    export function getImagesByType(id: number, imageType: 'tv', jwt?: JWT)
    {
        return sendRequest<{ backdrops: TmdbImage[], id: number, posters: TmdbImage[] }>(`/3/${imageType}/${id}/images`, null, 'en', jwt);
    }

    export function configuration()
    {
        return sendRequest<{ images: { base_url: string, secure_base_url: string, backdrop_sizes: string[], logo_sizes: string[], poster_sizes: string[], profile_sizes: string[], still_sizes: string[] } }>('/3/configuration');
    }

    export var posterBaseUrl: string;
    export var backdropBaseUrl: string;
    export var stillBaseUrl: string;

    export function sendRequest<T>(path: string, queryString?: { [key: string]: string | string[] }, requestLanguage?: string, jwt?: JWT): PromiseLike<T>
    {
        requestLanguage = requestLanguage || language;
        if ((!posterBaseUrl || !backdropBaseUrl) && path != '/3/configuration')
        {
            return configuration().then((config) =>
            {
                posterBaseUrl = config.images.secure_base_url + 'original';
                backdropBaseUrl = config.images.secure_base_url + 'original';
                stillBaseUrl = config.images.secure_base_url + 'original';
                return sendRequest<T>(path, queryString, requestLanguage, jwt);
            })
        }
        return http.call({
            url: url.format(new url.URL(path, 'https://api.themoviedb.org/')),
            queryString: Object.assign({ api_key: jwt && jwt.token || currentJwt && currentJwt.token, language: requestLanguage || undefined }, queryString),
            type: 'json',
            method: 'GET'
        }).then(function (result)
        {
            if (result.status == 404)
                return null;
            if (result.status == 200)
                return result.json();
            return Promise.reject(result) as PromiseLike<T>;
        }, function (err)
            {
                console.error(err);
                return Promise.reject(err);
            });
    }
}

type cache = { media: api.TmdbMovieExtended, seasons: never } | { media: api.TmdbShowExtended | api.TmdbMovieExtended, seasons: api.TmdbSeasonExtended[] };
var nameCache: { [key: string]: PromiseLike<(api.TmdbMovie | api.TmdbPerson | api.TmdbShow)[]> } = {};
var idCache: { [key: number]: PromiseLike<cache> } = {};
export function tvdbScrapper(mediaType: MediaType, media: DbTvShow | DbTvMovie): PromiseLike<string>
{
    var handleSerie = function (cacheItem: cache)
    {
        var newName = media.displayName;
        if (cacheItem.media.poster_path && (media.episode == 1 || !media.episode))
            media.cover = api.posterBaseUrl + cacheItem.media.poster_path;
        let conf: number;
        if (cacheItem.media.media_type == 'tv')
        {
            var tvshow = media as DbTvShow;
            if (tvshow.season)
            {
                var episode = cacheItem.seasons.find(s => s.season_number == tvshow.season).episodes.find(e => e.episode_number == tvshow.episode);
                tvshow.still = api.stillBaseUrl + episode.still_path;
            }

            conf = confidence(media.name, [cacheItem.media.name, cacheItem.media.original_name].concat(akala.map(cacheItem.media.alternative_titles.results, at => at.title)))
            if (conf > 0.5)
                media.subType = 'tvshow';
            if (cacheItem.seasons && media.subType == 'tvshow')
            {
                media.episodes = cacheItem.seasons.reduce(function (previous, season)
                {
                    return previous + season.episodes.length;
                }, 0);
                var matchingSeason = akala.grep(cacheItem.seasons, function (e)
                {
                    return (!media.season && e.season_number == 1 || media.season == e.season_number);
                })[0];
                var matchingEpisode = matchingSeason.episodes.find(function (e)
                {
                    return media.episode && e.episode_number == media.episode;
                });
                if (matchingEpisode)
                {
                    if (conf > 0.5 && media.episode)
                        newName = newName + ' - ' + matchingEpisode.episode_number;
                }
            }
            if (akala.grep(cacheItem.media.genres, function (genre) { return genre.name == 'Animation' }).length)
                if (conf > 0.5)
                    return 'Animes/' + cacheItem.media.name + '/' + newName + path.extname(media.path);
                else
                    return 'Animes/' + (media.originalName || media.name) + '/' + newName + path.extname(media.path);
            else
                return 'TV Series/' + cacheItem.media.name + '/' + newName + path.extname(media.path);
        }
        else
        {
            if (conf > 0.5)
            {
                media.subType = 'movie';
            }
            return 'Movies/' + cacheItem.media.title + path.extname(media.path);
        }
    };
    var buildPath = function (item: api.TmdbMedia)
    {
        if (item.overview)
            media.overview = item.overview;
        media.tmdbid = item.id;
        if (item.media_type == 'movie')
            media.subType = 'movie';
        else
            media.subType = 'tvshow';
        if (!idCache[media.tmdbid])
            if (media.subType == 'tvshow')
                idCache[media.tmdbid] = api.getSerie(media.tmdbid).then((serie) =>
                {
                    if (serie.overview && media.episode == 1 && media.season == 1)
                        item.overview = serie.overview;

                    if (!serie.alternative_titles && confidence(media.name, [serie.name, serie.original_name]) > 0.8
                        || serie.alternative_titles && confidence(media.name, [serie.name, serie.original_name].concat(akala.map(serie.alternative_titles.results, (alternativeTitle) => alternativeTitle.title))) > 0.8)
                    {
                        if (item.media_type == 'tv')
                            media.name = item.name;
                        else
                            media.name = item.title;
                    }
                    return Promise.all(akala.map(serie.seasons, function (season)
                    {
                        return api.getSeason(media.tmdbid, season.season_number);
                    })).then((seasons) =>
                    {
                        return {
                            media: serie, seasons: seasons.sort(function (show1, show2)
                            {
                                if (show1.season_number == show2.season_number)
                                    return 0;
                                if (show1.season_number < show2.season_number)
                                    return -1;
                                return 1;
                            })
                        };
                    }) as PromiseLike<cache>
                });
            else if (media.subType == 'movie')
                idCache[media.tmdbid] = api.getMovie(media.tmdbid).then((serie) =>
                {
                    return {
                        media: serie,
                        seasons: null
                    };
                });
        return idCache[media.tmdbid].then((serie) => handleSerie(serie));
    };

    var confidence = function (name: string, names: string[])
    {
        var max = 0;
        name = name.toLowerCase().replace(/[^A-Z0-9 ]/gi, '');
        if (names)
        {
            log(`${name} confidence in ${names}`);
            akala.each(names, function (n)
            {
                if (!n)
                    return;
                console.log(n);
                var tokens = n.replace(/ \([0-9]{4}\)$/, '').replace(/[^A-Z0-9 ]/gi, '').toLowerCase();
                var lev = new levenshtein(name, tokens).distance;
                var c = 1 - lev / tokens.length;
                if (lev < 3 && c >= max)
                {
                    max = c;
                }
                var tokenArray = tokens.split(' ');
                var match = akala.grep(tokenArray, function (token: string)
                {
                    var indexOfToken = name.indexOf(token);
                    return token.length > 0 && indexOfToken > -1 && (indexOfToken + token.length == name.length || /^[^A-Z]/i.test(name.substring(indexOfToken + token.length)));
                });
                c = match.length / name.split(' ').length * match.length / tokenArray.length;
                if (c >= max)
                    max = c;
            });
        }
        return max;;
    };
    function handleResults(item: api.TmdbMedia[])
    {
        /*if(media.name.toLowerCase()=='forever')
        {
            console.log(data.Series);
        }*/
        if (item && item.length == 1)
        {
            return buildPath(item[0]);
        }
        else if (item && item.length === 0)
        {
            var splittedName = media.name.split(' ');
            if (splittedName.length > 1)
            {
                return tvdbScrapper(mediaType, akala.extend({}, media, { name: splittedName[0], originalName: media.name })).then((result) => { return result; },
                    (error) =>
                    {
                        return tvdbScrapper(mediaType, akala.extend({}, media, { name: splittedName[1], originalName: media.name }));
                    });
            }
            else
                return Promise.reject({ code: 404, message: 'Not found' });
        }
        else
        {
            var name = media.originalName || media.name;
            var max = 0;
            var matchingSeries: api.TmdbMedia = null;
            if (item)
                akala.each(item, function (m)
                {

                    var c: number;

                    if (m.media_type == 'movie')
                        c = confidence(name, [m.title, m.original_title]);
                    else
                        c = confidence(name, [m.name, m.original_name]);
                    if (c >= max)
                    {
                        if (c != max)
                        {
                            /*if(matchingSeries)
                                console.log('replacing '+matchingSeries.SeriesName+'('+max+') by '+serie.SeriesName+'('+c+')');*/
                            max = c;
                            matchingSeries = m;
                        }
                    }
                });
            if (matchingSeries)
                return buildPath(matchingSeries);
            else
            {
                console.log('could no find a matching serie for ' + name);
                if (item)
                    log(item);
                return Promise.resolve(media.path);
            }
        }
    }

    if (media.tmdbid)
    {
        if (!idCache[media.tmdbid])
            if (media.subType == 'tvshow')
                idCache[media.tmdbid] = api.getSerie(media.tmdbid).then((serie) =>
                {
                    return Promise.all(akala.map(serie.seasons, function (season)
                    {
                        return api.getSeason(media.tmdbid, season.season_number);
                    })).then((seasons) =>
                    {
                        return {
                            media: serie, seasons: seasons.sort(function (show1, show2)
                            {
                                if (show1.season_number == show2.season_number)
                                    return 0;
                                if (show1.season_number < show2.season_number)
                                    return -1;
                                return 1;
                            })
                        };
                    }) as PromiseLike<cache>
                });
            else if (media.subType == 'movie')
                idCache[media.tmdbid] = api.getMovie(media.tmdbid).then((serie) =>
                {
                    return {
                        media: serie,
                        seasons: null
                    };
                });
        idCache[media.tmdbid].then(cache => handleSerie(cache));
    }

    if (!nameCache[media.name])
        nameCache[media.name] = api.searchMediaByName(media.name).then((result) =>
        {
            return result.results
        });
    return nameCache[media.name].then(handleResults, function (err)
    {
        if (err)
            log(err);
        throw err;
    });
}