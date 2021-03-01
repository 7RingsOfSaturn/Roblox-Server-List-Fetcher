const Axios = require(`axios`)
const Readline = require(`readline`)

const ErrorTimeout = 500

async function Sleep(Timeout) {
    return new Promise((Resolve) => setTimeout(Resolve, Timeout))
}

async function FetchServersForPlaceIdAtCursor(PlaceId, Cursor) { // hmm....
    const FetchPromise = new Promise((Resolve) => {
        Axios.get(`https://games.roblox.com/v1/games/${PlaceId}/servers/public?limit=100&cursor=${Cursor}`)
            .then((Response) => {
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
            
                Resolve([Servers, Response.data.nextPageCursor])
            })
            .catch(async () => {
                process.title = `Caught error. Retrying request in ${ErrorTimeout}ms`

                await Sleep(ErrorTimeout)

                Resolve(FetchServersForPlaceIdAtCursor(PlaceId, Cursor))
            })
    }) 

    return FetchPromise
}

async function GetServersForPlaceId(PlaceId) {
    const Servers = []

    let Cursor = ""

    while (Cursor != null) {
        const [FetchedServers, NextCursor] = await FetchServersForPlaceIdAtCursor(PlaceId, Cursor)

        for (const Server of FetchedServers) {
            process.title = `Fetched ${Server.Id} | ${Server.Playing} playing / ${Server.MaxPlayers} max | ${Server.Ping}ms ping`
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
            
            const Ping = `Ping: ` + `${Server.Ping || "?"}`.padEnd(4) + `ms`
            const FPS = `\tFPS: ` + `${Math.floor(Server.FPS)}`.padStart(2)
            const Playing = `\tPlaying: ${Server.Playing} of ${Server.MaxPlayers}`
            const Script = `\tScript: ${LauncherScript}`

            console.log(Ping, FPS, Playing, Script)

            TotalPlayers = TotalPlayers + Server.Playing
        }

        process.title = `Found ${TotalPlayers} players and ${Servers.length} servers for place id ${PlaceId}`
    }
}

const Interface = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

Interface.on("line", OnInput)
