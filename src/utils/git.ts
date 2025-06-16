import simpleGit from 'simple-git'

export async function checkGitStatus(): Promise<void> {
  const git = simpleGit()

  const isRepo = await git.checkIsRepo()
  if (!isRepo) {
    throw new Error(
      'Not a git repository. Please run this command in a git repository.',
    )
  }

  const status = await git.status()
  const hasChanges = status.files.length > 0

  if (hasChanges) {
    throw new Error(
      'Git repository is not clean. Please commit or stash your changes before running this command.',
    )
  }
}
