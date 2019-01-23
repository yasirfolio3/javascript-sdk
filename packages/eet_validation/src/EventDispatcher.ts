import * as optimizely from '@optimizely/optimizely-sdk'
import cli from 'cli-ux'
import * as inquirer from 'inquirer'

const defaultEventDispatcher = require('@optimizely/optimizely-sdk/lib/plugins/event_dispatcher/index.node.js')

export namespace EventDispatcher {
  export type Config = Partial<{
    url: string
    interactive: boolean
  }>
}

export class EventDispatcher implements optimizely.EventDispatcher {
  constructor(private config: EventDispatcher.Config) {}

  async dispatchEvent(event: optimizely.Event, callback: () => void) {
    if (this.config.url) {
      event.url = this.config.url
    }

    event = await (this.config.interactive ? editEvent(event) : Promise.resolve(event))

    if (!event) {
      cli.info('Event is empty; Aborting dispatch')
      return
    }

    cli.action.start('Dispatching event')
    cli.styledHeader('Event')
    cli.styledJSON(event)

    defaultEventDispatcher.dispatchEvent(event, (resp: any) => {
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

function editEvent(event: optimizely.Event): Promise<optimizely.Event> {
  const parse: (input: string) => optimizely.Event =
    input => (!/^\s+$/.test(input)) ? JSON.parse(input) : null

  const editorPrompt: inquirer.Question = {
    type: 'editor',
    name: 'editedEvent',
    message: 'Edit event payload',
    default: JSON.stringify(event, null, '  '),
    validate: (input: string) => {
      try {
        parse(input)
      } catch (e) {
        return e.message
      }
      return true
    },
  }

  return inquirer.prompt(editorPrompt).then(answers => parse(answers.editedEvent))
}
