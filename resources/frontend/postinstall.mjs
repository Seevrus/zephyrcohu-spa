import path from "node:path";

import fse from "fs-extra";

const currentDirectory = import.meta.dirname;

fse.emptyDirSync(path.join(currentDirectory, "src", "assets", "tinymce"));

fse.copySync(
  path.join(currentDirectory, "node_modules", "tinymce"),
  path.join(currentDirectory, "src", "assets", "tinymce"),
  { dereference: true, overwrite: true },
);

fse.copySync(
  path.join(currentDirectory, "tinymce", "langs"),
  path.join(currentDirectory, "src", "assets", "tinymce", "langs"),
  { overwrite: true },
);
