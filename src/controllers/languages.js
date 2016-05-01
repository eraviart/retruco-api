// Retruco-API -- HTTP API to bring out shared positions from argumented statements
// By: Paula Forteza <paula@gouv2.fr>
//     Emmanuel Raviart <emmanuel@gouv2.fr>
//
// Copyright (C) 2016 Paula Forteza & Emmanuel Raviart
// https://git.framasoft.org/retruco/retruco-api
//
// Retruco-API is free software; you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// Retruco-API is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.



export function requireLanguage(paramName) {
  return async function requireLanguage(ctx, next) {
    let languageCode
    if (ctx.parameter) {
      languageCode = ctx.parameter[paramName]  // koa-swager
    } else {
      // koa-validate
      ctx.checkParams(paramName)
        .notEmpty()
      languageCode = ctx.params[paramName]
    }
    ctx[paramName] = languageCode
    await next()
  }
}