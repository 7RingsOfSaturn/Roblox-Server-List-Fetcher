const Axios = require(`axios`)
const Readline = require(`readline`)

async function FetchServersForPlaceIdAtCursor(PlaceId, Cursor) {
    const Request = Axios.get(`https://games.roblox.com/v1/games/${PlaceId}/servers/public?limit=100&cursor=${Cursor}`)
    const Response = await Request

    const Servers = []
    const FetchedServers = Response.data.data

    for (const FetchedServer of FetchedServers) {
        const Server = {
            Id: FetchedServer.id,
            Playing: FetchedServer.playing,
            MaxPlayers: FetchedServer.maxPlayers,
            FPS: FetchedServer.fps,
            Ping: FetchedServer.ping
        }

        Servers.push(Server)
    }

    return [Servers, Response.data.nextPageCursor]
}

async function GetServersForPlaceId(PlaceId) {
    const Servers = []

    let Cursor = ""

    while (Cursor != null) {
        const [FetchedServers, NextCursor] = await FetchServersForPlaceIdAtCursor(PlaceId, Cursor)

        for (const Server of FetchedServers) {
            process.title = `Fetched ${Server.Id} [${Server.Playing}/${Server.MaxPlayers}]`
            Servers.push(Server)
        }

        Cursor = NextCursor
    }

    return Servers
}

async function OnInput(Input) {
    const Match = Input.match(/\d+/)

    if (Match) {
        const PlaceId = Match[0]
        const Servers = await GetServersForPlaceId(PlaceId)

        let TotalPlayers = 0

        for (const Server of Servers) {
            const LauncherScript = `Roblox.GameLauncher.joinGameInstance(${PlaceId}, "${Server.Id}")`

            console.log(`Ping: ` + `${Server.Ping || "?"}`.padEnd(4) + `ms`, `\tFPS: ` + `${Math.floor(Server.FPS)}`.padStart(2), `\tPlaying: ${Server.Playing} of ${Server.MaxPlayers}`, `\tScript: ${LauncherScript}`)

            TotalPlayers = TotalPlayers + Server.Playing
            //console.log(Server.Id, `${Server.Playing}/${Server.MaxPlayers}`)
        }

        process.title = `Found ${TotalPlayers} players and ${Servers.length} servers for place id ${PlaceId}`
    }
}

const Interface = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

Interface.on("line", OnInput)
