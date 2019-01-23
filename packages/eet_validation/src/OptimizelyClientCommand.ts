import Command, {flags} from '@oclif/command'
import * as optimizely from '@optimizely/optimizely-sdk'
import cli from 'cli-ux'
import Conf = require('Conf')
import * as rp from 'request-promise'

import {EventDispatcher} from './EventDispatcher'

export abstract class OptimizelyClientCommand extends Command {
  static flags = {
    help: flags.help({char: 'h'}),
    datafile: flags.string({
      description: 'JSON contents of datafile to use',
      env: 'DATAFILE_JSON',
      hidden: true,
      exclusive: ['datafileUrl']
    }),
    datafileUrl: flags.string({
      description: 'URL to fetch datafile JSON content from',
      char: 'd',
      env: 'DATAFILE_URL',
      required: true,
      exclusive: ['datafile'],
    }),
    logHost: flags.string({
      hidden: true,
      env: 'LOGX_URL',
    }),
    interactive: flags.boolean({
      description: 'let the user edit dispatched events prior to being sent',
      char: 'i',
    }),
  }

  static strict = false

  private _conf!: Conf
  private _optimizely!: optimizely.Client

  async init() {
    this._conf = new Conf()
  }

  get conf(): Conf {
    return this._conf
  }

  async fetchDatafile(): Promise<object> {
    const {flags} = await this.parse(OptimizelyClientCommand)
    if (flags.datafile && flags.datafile !== '') {
      return JSON.parse(flags.datafile)
    }

    cli.action.start('fetching datafile')
    const datafile = await rp({uri: flags.datafileUrl!, json: true})
    cli.action.stop('success')
    return datafile
  }

  async optimizelyClient(): Promise<optimizely.Client> {
    if (this._optimizely) {
      return this._optimizely
    }

    const datafile = await this.fetchDatafile()

    cli.action.start('Instantiating Optimizely client')

    const {flags} = await this.parse(OptimizelyClientCommand)

    this._optimizely = optimizely.createInstance({
      datafile,
      eventDispatcher: new EventDispatcher(flags)
    })

    cli.action.stop()

    return this._optimizely
  }
}
