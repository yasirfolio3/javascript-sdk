import Command, {flags} from '@oclif/command'
import * as optimizely from '@optimizely/optimizely-sdk'
import cli from 'cli-ux'
import * as rp from 'request-promise'

import {EventDispatcher} from './EventDispatcher'

export abstract class BaseCommand extends Command {
  static flags = {
    help: flags.help({char: 'h'}),
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

  private _flags!: {[f: string]: any}
  private _optimizely!: optimizely.Client

  async init() {
    const {flags} = await this.parse(BaseCommand)
    this._flags = flags
  }

  async fetchDatafile(): Promise<any> {
    cli.action.start('fetching datafile')
    const datafile = await rp({uri: this._flags.datafile!})
    cli.action.stop('success')
    return datafile
  }

  async optimizely(): Promise<optimizely.Client> {
    if (this._optimizely) {
      return this._optimizely
    }

    const datafile = await this.fetchDatafile()

    cli.action.start('instantiating Optimizely client')
    const eventDispatcher = new EventDispatcher(this._flags.logHost)

    this._optimizely = optimizely.createInstance({
      datafile,
      eventDispatcher
    })

    cli.action.stop()

    return this._optimizely
  }
}
