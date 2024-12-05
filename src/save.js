import { BaseDirectory } from "@tauri-apps/api/path"

function makeSaveSystem(savefileName) {
  return {
    data: {},
    async save() {
      await writeTextFile(savefileName, JSON.stringify(this.data), {dir: BaseDirectory.AppLocalData,

      });
    },
    async load() {
      try{
          this.data = JSON.parse(
            await readTextFile(savefileName, {dir: BaseDirectory.AppLocalData})
          );
      }catch {
          this.data = {};
      }
    },
  };
}

export const saveSystem = makeSaveSystem("save.json");