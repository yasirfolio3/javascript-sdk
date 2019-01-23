import {flags} from '@oclif/command'

import {OptimizelyClientCommand} from '../OptimizelyClientCommand'

export default class Track extends OptimizelyClientCommand {
  static description = 'tracks event conversion'

  static flags = {
    ...OptimizelyClientCommand.flags,
    user: flags.string({
      char: 'u',
      required: true
    }),
    event: flags.string({
      char: 'e',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Track)

    const opti = await this.optimizelyClient()

    const tags = {}

    opti.track(flags.event, flags.user, this.userAttributes, tags)
  }

  get userAttributes(): { [k: string]: string } {
    return {}
  }
}
