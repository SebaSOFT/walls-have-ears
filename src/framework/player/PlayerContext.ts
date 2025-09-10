import WHEUtils from '../../utils/WHEUtils';
import { getGame } from '../../foundry/getGame';

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

/**
 * Manages the player's token context, primarily tracking the selected token for muffling calculations.
 */
export default class PlayerContext {
  private static instance: PlayerContext;
  private selectedToken: foundry.canvas.placeables.Token | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of the PlayerContext.
   * @returns {PlayerContext} The singleton instance.
   */
  public static getInstance = () => {
    if (!PlayerContext.instance) {
      PlayerContext.instance = new PlayerContext();
    }
    return PlayerContext.instance;
  };

  /**
   * Gets the currently selected token that acts as the listener for sounds.
   * @returns {foundry.canvas.placeables.Token | null} The selected token, or null if none is selected.
   */
  public getSelectedToken = (): foundry.canvas.placeables.Token | null => {
    return this.selectedToken;
  };

  /**
   * Updates the selected token based on the user's control actions.
   * If a token is selected, it becomes the listener. If deselected, it tries to find the user's character token.
   * @param {foundry.canvas.placeables.Token} token - The token being controlled or uncontrolled.
   * @param {boolean} selected - Whether the token is being selected or deselected.
   */
  public checkForChangedSelection = async (token: foundry.canvas.placeables.Token, selected: boolean) => {
    if (!selected) {
      WHEUtils.log('No token selected but getting from user');
      this.selectedToken = this.getActingToken({
        actor: getGame().user!.character ?? undefined,
      });
    } else {
      WHEUtils.log('Token Selected so it should be yours');
      this.selectedToken = token;
    }
  };

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
    const tokenLayer: TokenLayer | null = getGame().canvas!.tokens ?? null;
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
      if (potentialTokens.length === 0 && getGame().user!.character) {
        // getActiveTokens returns an array of Token objects
        potentialTokens = getGame().user!.character!.getActiveTokens();
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
