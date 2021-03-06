// Retruco-API -- HTTP API to bring out shared positions from argumented statements
// By: Paula Forteza <paula@retruco.org>
//     Emmanuel Raviart <emmanuel@retruco.org>
//
// Copyright (C) 2016, 2017 Paula Forteza & Emmanuel Raviart
// https://framagit.org/retruco/retruco-api
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

import https from "https"
import fetch from "node-fetch"

import config from "./config"

const matrixConfig = config.matrix

export function sendMatrixMessage(text) {
  if (matrixConfig !== null) {
    fetch(
      matrixConfig.serverUrl +
        "/_matrix/client/r0/rooms/" +
        encodeURIComponent(matrixConfig.roomId) +
        "/send/m.room.message?access_token=" +
        matrixConfig.accessToken,
      {
        agent: new https.Agent({
          rejectUnauthorized: matrixConfig.rejectUnauthorized === undefined ? true : matrixConfig.rejectUnauthorized,
        }),
        body: JSON.stringify({
          body: text,
          format: "org.matrix.custom.html",
          formatted_body: text,
          msgtype: "m.text",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    )
    // .then(res => res.json())
    // .then(json => console.log(json))
  }
}
