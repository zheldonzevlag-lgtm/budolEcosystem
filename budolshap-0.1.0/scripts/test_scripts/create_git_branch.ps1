param (
    [Parameter(Mandatory = $true)]
    [string]$BranchName,
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage
)

$ErrorActionPreference = "Stop"

try {
    Write-Host "Creating and switching to branch '$BranchName'..."
    git checkout -b $BranchName

    Write-Host "Adding all changes..."
    git add .

    Write-Host "Committing changes with message: '$CommitMessage'..."
    git commit -m "$CommitMessage"

    Write-Host "Pushing branch to origin..."
    git push -u origin $BranchName

    Write-Host "Successfully created and pushed branch '$BranchName'." -ForegroundColor Green
}
catch {
    Write-Error "An error occurred: $_"
    exit 1
}
