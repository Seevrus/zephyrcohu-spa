import { Validators } from "@angular/forms";

import { allowedPasswordCharacters } from "../../constants/forms";

const passwordPattern = new RegExp(`([${allowedPasswordCharacters}]){8,}`);

export const passwordValidator = Validators.pattern(passwordPattern);
