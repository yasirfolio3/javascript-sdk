import {flags} from '@oclif/command'
import cli from 'cli-ux'

import {BaseCommand} from '../base'

export default class Activate extends BaseCommand {
  static description = 'activates an experiment impression'

  static flags = {
    ...BaseCommand.flags,
    userId: flags.string({
      name: 'user',
      char: 'u',
      required: true
    }),
  }

  static args = [{name: 'experimentKey', required: true}]

  async run() {
    const {args, flags} = this.parse(Activate)

    const opti = await this.optimizely()

    cli.action.start('Performing activate')
    const decision = opti.activate(
      args.experimentKey,
      flags.userId,
      this.userAttributes
    )
    cli.action.stop()

    cli.styledHeader('Result')
    cli.styledJSON(decision)
  }

  get userAttributes(): { [k: string]: string } {
    return {}
  }
}
