import {flags} from '@oclif/command'

import {BaseCommand} from '../base'

export default class Track extends BaseCommand {
  static description = 'tracks event conversion'

  static flags = {
    ...BaseCommand.flags,
    userId: flags.string({
      name: 'user',
      char: 'u',
      required: true
    })
  }

  static args = [{name: 'eventKey', required: true}]

  async run() {
    const {args, flags} = this.parse(Track)

    const opti = await this.optimizely()

    const tags = {}

    opti.track(args.eventKey, flags.userId, this.userAttributes, tags)
  }

  get userAttributes(): { [k: string]: string } {
    return {}
  }
}
