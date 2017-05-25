/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const request = require('request');

module.exports = function() {
	return async function(ctx, next) {
		ctx.forward = function(options) {
			if(typeof options === 'string') {
				options = {
					uri: options
				};
			}

			options = options || {};

			delete ctx.header.host;

			options.simple = false;
			options.encoding = null;
			options.followRedirect = false;
			options.resolveWithFullResponse = true;
			options.method = options.method || ctx.method;
			options.headers = options.headers || ctx.headers;
			options.qs = options.qs || ctx.query;

			// 2017-04-28 AMR TODO: handle compressed data correctly
			return new Promise(function(resolve, reject) {
				const r = request(options, function(err, response, body) {
					if(err) {
						console.log('error: ' + err);
						return reject(err);
					} else if(response.statusCode != 200) {
						ctx.status = response.statusCode;
					}

					for(const name in response.headers) {
						ctx.set(name, response.headers[name]);
					}

					ctx.body = body;
					resolve(response);
				});
				if(ctx.request.rawBody !== undefined) {
					r.write(ctx.request.rawBody);
				}
			});
		}

		if(ctx.request.rawBody === undefined) {
			ctx.request.rawBody = await new Promise(function(resolve, reject) {
				var data = '';
				ctx.req.on('data', function(chunk) {
					data += chunk;
				});
				ctx.req.on('end', function() {
					resolve(data);
				});
				ctx.req.on('error', function(err) {
					reject(err);
				});
			}).then(function(data) {
				return data;
			});
		}

		await next();
	}
}
