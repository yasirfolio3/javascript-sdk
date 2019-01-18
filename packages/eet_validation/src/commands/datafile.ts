import {flags} from '@oclif/command'
import cli from 'cli-ux'

const jq = require('node-jq')

import {BaseCommand} from '../base'

export default class Datafile extends BaseCommand {
  static description = 'fetches datafile'

  static flags = {
    ...BaseCommand.flags,
    query: flags.string({
      char: 'q'
    })
  }

  async run() {
    const {flags} = this.parse(Datafile)

    const datafile = await this.fetchDatafile()

    let out = JSON.parse(datafile)
    if (flags.query) {
      out = await jq.run(flags.query, out, {input: 'json', output: 'json'})
    }

    cli.styledJSON(out)
  }
}
