import WHEUtils from '../utils/WHEUtils';

/**
 * Options for the getActingToken method.
 */
interface GetActingTokenOptions {
  /** An actor to find a token for. */
  actor?: foundry.documents.Actor;
  /** If true, show a warning notification if multiple tokens are found. */
  warn?: boolean;
  /** If true, only consider tokens that are linked to their actor. */
  linked?: boolean;
}

export default class WHEFramework {
  private static instance: WHEFramework;

  private selectedToken: foundry.canvas.placeables.Token | null = null;

  private constructor() {}

  public static getInstance = () => {
    if (!WHEFramework.instance) {
      WHEFramework.instance = new WHEFramework();
    }
    return WHEFramework.instance;
  };

  public initialize(): void {
    WHEUtils.log('WHEFramework initialize...');
    // ---------- H O O K S ---------- //
    // Hook wen the scene is ready
    Hooks.on('ready', async () => {
      await game.audio!.awaitFirstGesture();

      WHEFramework.getInstance().setSelectedToken(this.getActingToken());
      WHEFramework.getInstance().performMuffling();
    });
    // When a token is about to be moved
    Hooks.on('updateToken', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateToken');
      WHEFramework.getInstance().performMuffling();
    });
    // When a Door is about to be opened
    Hooks.on('updateWall', (_token, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateWall');
      WHEFramework.getInstance().performMuffling();
    });
    // When ambient sound is about to be moved
    Hooks.on('updateAmbientSound', (_ambientSound, _updateData, _options, _userId) => {
      WHEUtils.log('WHEFramework Event: updateAmbientSound');
      WHEFramework.getInstance().performMuffling();
    });
    // When the user starts controlling a token
    Hooks.on('controlToken', async (token, selected) => {
      await WHEFramework.getInstance().checkForChangedSelection(token, selected);
    });
    Hooks.on('closeAmbientSoundConfig', (soundConfig) => {
      const sound = soundConfig.document;
      console.log('WHE | soundconfig', sound);
    });
    Hooks.on('renderAmbientSoundConfig', (_app, html, _data, _options) => {
      WHEFramework.getInstance().modifySoundConfigForm(html);
    });
    // ---------- H O O K S ---------- //

    WHEUtils.log('WHEFramework initialized.');
  }

  public modifySoundConfigForm = (html: HTMLElement) => {
    const fieldSets = html.getElementsByTagName('fieldset');
    let foundFields = false;
    for (let i = 0; i < fieldSets.length; i++) {
      const fieldset = fieldSets.item(i);
      if (fieldset) {
        const fields = fieldset.getElementsByClassName('form-group');
        for (let j = 0; j < fields.length; j++) {
          const fieldGroup = fields.item(j);
          const field = fieldGroup?.getHTML();
          if (field?.indexOf('"effects.muffled.type"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
          if (field?.indexOf('"effects.muffled.intensity"') !== -1) {
            fieldGroup?.setAttribute('style', 'display:none;');
            foundFields = true;
          }
        }
        if (foundFields) {
          const hints = fieldset.getElementsByClassName('hint');
          const lastHint = hints.item(hints.length - 1);
          if (lastHint) {
            const warningText = WHEUtils.getMessageText('WHE.config.hint');
            lastHint.innerHTML = `<i>${warningText}</i>`;
          }
          break;
        }
      }
    }
  };

  public checkForChangedSelection = async (token: foundry.canvas.placeables.Token, selected: boolean) => {
    if (!selected) {
      WHEUtils.log('No token selected but getting from user');
      this.selectedToken = this.getActingToken({
        actor: game.user?.character ?? undefined,
      });
    } else {
      WHEUtils.log('Token Selected so it should be yours');
      this.selectedToken = token;
    }
    if (this.selectedToken) {
      WHEUtils.log(`Token obtained, id: ${this.selectedToken.name} (${this.selectedToken.id})`);
      await game.audio!.awaitFirstGesture();
      this.performMuffling();
    } else {
      WHEUtils.log('Looks like you are the GM');
    }
  };

  /**
   * Sets the currently selected token.
   * @param token The token to set as the selected token.
   */
  public setSelectedToken = (token: foundry.canvas.placeables.Token | null) => {
    if (!token) {
      WHEUtils.log('Selected no tokens');
    } else {
      WHEUtils.log(`Selected a token ${token.name}: (${token.id})`);
    }
    this.selectedToken = token;
  };

  /**
   * Loops through the sounds in the scene and estimate if its audible and the eventual
   * muffling index, after estimate that, applies the audio filter correspondingly
   */
  public performMuffling() {
    if (!this.selectedToken) {
      return;
    }

    //DO THA MUFFLING
  }

  /**
   * Gets the single acting token based on the provided options.
   * This could be a token controlled by the user, or a token associated with a specific actor.
   *
   * @param {GetActingTokenOptions} options - The options for getting the token.
   * @returns {foundry.canvas.placeables.Token | null} The token object or null if no single token is found.
   */
  private getActingToken = ({
    actor = undefined,
    warn = false,
    linked = false,
  }: GetActingTokenOptions = {}): foundry.canvas.placeables.Token | null => {
    const tokenLayer: TokenLayer | null = game.canvas?.tokens ?? null;
    if (!tokenLayer) {
      return null;
    }

    let potentialTokens: foundry.canvas.placeables.Token[];

    if (actor) {
      const controlledTokens = tokenLayer.controlled;
      if (controlledTokens.length > 0) {
        potentialTokens = controlledTokens.filter(
          (token) => token.actor?.id === actor.id && (!linked || token.document.actorLink),
        );
      } else {
        potentialTokens = actor.getActiveTokens();
        if (linked) {
          potentialTokens = potentialTokens.filter((token) => token.document.actorLink);
        }
      }
    } else {
      potentialTokens = [...tokenLayer.controlled];
      if (potentialTokens.length === 0 && game.user?.character) {
        // getActiveTokens returns an array of Token objects
        potentialTokens = game.user.character.getActiveTokens();
      }
    }

    if (potentialTokens.length > 1) {
      if (warn) {
        ui.notifications?.warn('WHE: Multiple possible acting tokens found. Please select a single token.');
      }
      return null;
    }

    return potentialTokens[0] ?? null;
  };
}
