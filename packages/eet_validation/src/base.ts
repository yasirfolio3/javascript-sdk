import Command, {flags} from '@oclif/command'
import * as optimizely from '@optimizely/optimizely-sdk'
import cli from 'cli-ux'
import * as rp from 'request-promise'

const defaultEventDispatcher = require('@optimizely/optimizely-sdk/lib/plugins/event_dispatcher/index.node.js')

class EventDispatcher implements optimizely.EventDispatcher {
  constructor(public logUrl: string | null) {}

  dispatchEvent(event: optimizely.Event, callback: () => void) {
    if (this.logUrl) {
      event.url = this.logUrl
    }

    cli.action.start('Dispatching event')
    cli.styledHeader('Event')
    cli.styledJSON(event)

    defaultEventDispatcher.dispatchEvent(event, resp => {
      callback()
      cli.action.stop()
      if (resp) {
        cli.styledHeader('Response')
        cli.styledObject(
          {
            status: resp.statusCode,
            headers: resp.headers
          },
          ['status', 'headers']
        )
      }
    })
  }
}

export abstract class BaseCommand extends Command {
  static flags = {
    help: flags.help({char: 'h'}),
    userId: flags.string({
      name: 'user',
      char: 'u',
      required: true
    }),
    datafile: flags.string({
      env: 'DATAFILE_URL',
      default:
        'https://cdn.optimizely.com/datafiles/Dacn5ByBfNpdymcXKhZp15.json'
    }),
    logHost: flags.string({
      hidden: true,
      env: 'LOGX_URL',
    })
  }

  static strict = false

  private _optimizely: optimizely.Client

  async init() {}

  async optimizely(): Promise<optimizely.Client> {
    if (this._optimizely) {
      return this._optimizely
    }

    const {flags} = await this.parse(BaseCommand)

    cli.action.start('fetching datafile')
    const datafile = await rp({uri: flags.datafile})
    cli.action.stop('success')

    cli.action.start('instantiating Optimizely client')
    const eventDispatcher = new EventDispatcher(flags.logHost)

    this._optimizely = optimizely.createInstance({
      datafile,
      eventDispatcher
    })

    cli.action.stop()

    return this._optimizely
  }

  get userAttributes(): { [k: string]: string } {
    return {}
  }
}
