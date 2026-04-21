import basicBranching from "./basicBranching";
import keyAndDoor from "./keyAndDoor";
import phoneMystery from "./phoneMystery";
import timedEscape from "./timedEscape";
import traitDemo from "./traitDemo";
import persuasionDemo from "./persuasionDemo";
import weightingDemo from "./weightingDemo";
import featuredSample from "./featuredSample";

const storySamples = [
  {
    id: "basic-branching",
    name: "Basic Branching",
    description: "A very simple two-choice branching story.",
    story: basicBranching,
  },
  {
    id: "key-and-door",
    name: "Key and Door",
    description: "A short story with a variable and locked choice.",
    story: keyAndDoor,
  },
  {
    id: "phone-mystery",
    name: "Phone Mystery",
    description: "A story using the chat block format.",
    story: phoneMystery,
  },
  {
    id: "timed-escape",
    name: "Timed Escape",
    description: "A short story with a countdown and timeout result.",
    story: timedEscape,
  },
  {
    id: "trait-demo",
    name: "Trait Picker Demo",
    description: "A simple demo of the trait picker mini-game.",
    story: traitDemo,
  },
  {
    id: "persuasion-demo",
    name: "Persuasion Demo",
    description: "A simple persuasion mini-game example.",
    story: persuasionDemo,
  },
  {
    id: "weighting-demo",
    name: "Choice Weighting Demo",
    description: "A short example using weighted point allocation.",
    story: weightingDemo,
  },
  {
    id: "featured-sample",
    name: "Featured Sample",
    description: "A fuller story showing multiple StoryPlay features together.",
    story: featuredSample,
  },
];

export default storySamples;