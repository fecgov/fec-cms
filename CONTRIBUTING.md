## Welcome
We're glad you're thinking about contributing to an 18F open source project! If you're unsure about anything, ask us — or submit the issue or pull request anyway. The worst that can happen is that we’ll politely ask you to change something.

We love all friendly contributions, and we welcome your ideas about how to make the FEC's online presence more user friendly, accessible, and elegant.

To ensure a welcoming environment for our projects, our staff follows the [18F Code of Conduct](https://github.com/18F/code-of-conduct/blob/master/code-of-conduct.md); contributors should do the same. Please also check out the [18F Open Source Policy GitHub repository]( https://github.com/18f/open-source-policy).

If you’d prefer, you can also reach us by [email](mailto:betafeedback@fec.gov).

## Public domain
All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.

### Issues
We use GitHub issues to track user issues and team tasks. Whenever possible, we follow this outline:

1. Goal: a quick blurb explaining the bug or what the issue should accomplish. What is the user need?
2. Completion criteria: how we’ll know that this issue has been completed
3. Tasks to completion:
    - [ ] Use
    - [ ] Markdown
    - [ ] Checklists
4. Dependencies (optional): What other issues out there need to be completed before you can do this one? Include links to tickets with the dependency.

## Pull request and branching guidance

### Pull requests

#### Writing a pull request
Authoring a good pull request saves time for both the developer and anyone reviewing changes in code. It re-enforces the purpose and validity of the code change and it also makes it easier for reviewers to understand the changes at a glance before diving in.

**Do:**

  * Use a descriptive but succinct title
  * Try to keep it under 75 characters
  * Use a _verb/adjective_ aimed at a particular **feature**:
    * “_New_ **meetings archive** page,”
    * “_Changes_ to **candidate page** design,”
    * “_Fix_ for **election page** button”
  * Follow the pre-populated fields in the pull request template. Remember to delete fields you don’t use.
  * Include a summary that describes components that will be affected in the application
    * Include issue number(s) and other related PRs
  * Add screenshots, short videos, or gifs
    * When there are changes to styling or to the interface, a before/after image is helpful
    * In interactive features, an animated gif captures the movement and activity
  * Check to remove `print` statements and commented out code
  * Lint your code and double check indents and make sure to use proper spacing

**Don’t:**

  * Use overly verbose or technically detailed PR titles.
    * “New class .foo-bar on profile sections plus javascript changes on design pages,” could be “New interactions and designs for Committee profiles,”
    * “Tooltips on calendar now works when hovered with points” could be “Fixes for Calendar tooltips”
  * Leave unused blank fields in the pull request template when you submit it


##### Resources

* An [article about writing effective pull requests](https://www.atlassian.com/blog/git/written-unwritten-guide-pull-requests) from Atlassian.
* An [article on writing good commit messages](https://chris.beams.io/posts/git-commit/) by Chris Beams


### Branching

#### Feature development branching
If you are developing a new feature, you can make a branch `feature/name-of-new-feature` but you can also use git flow to start it using `git flow feature start name-of-new-feature`.

#### Quick fix branching
Branches for fixes to an existing feature or modifications to the general codebase can be established as a feature with a name starting with “fix-” to differentiate themselves from full fledged features, for example `feature/fix-broken-button`.

#### Work in progress (WIP)
Work in progress PRs may be helpful to show that a feature is in active development for an extended period of time, especially if you're collaborating with other folks on an issue. Generally speaking, work shouldn't sit unmerged for long periods of time (that is a development antipattern), but in some cases this is preferred as it helps facilitate communication between team members and provides visibility into ongoing work. Furthermore, it will allow the tests to run in CircleCI, which provides you with feedback as you work. You should be pushing your commits regularly as you make progress so that you receive automated testing feedback early and often to take advantage of this!

If you are intentially opening a PR early and intend it to be a work in progress, please do the following:

* Put `[WIP]` at the start of the PR title
* Place `WIP:  PLEASE DO NOT MERGE` in bold at the top of the PR description

When the PR is ready for full review and no longer a WIP, please remove these two items.

### Ready for review

#### Labeling
After you open the PRs and it’s ready for review, apply the label “plz-review” and tag a specific person to review it. If the PRs needs to be included in the next release, apply the “Before release” label so that reviewers recognize that it’s a priority.

#### Getting a PR review
Sometimes tagging a reviewer may not be enough. If a PR needs to be reviewed in a timely manner, reach out to folks individually to ask for help as they may not know the urgency of the PR needing a review.

#### Reviewing a pull request
Reviewing pull requests is not always easy and reviewers should make sure to block out time in their schedule so they are not rushed. Always make sure to pull down the branch and test the work on your local machine. DO NOT BLINDLY MERGE IN PRS YOU DO NOT UNDERSTAND. Do not feel shy about asking questions and requesting the author of the pull request to explain certain sections of their code. That is the purpose of a code review.

##### Resources
* [Tips for code reviews](http://engineering.khanacademy.org/posts/tips-for-code-reviews.htm) from Khan Academy

### Urgent fixes between releases

#### Hotfixes
To reiterate the [onboarding documentation](https://docs.google.com/document/d/18ZjPvNrdW3wn9pUx7hSNbaMlaEaPPOGzOHh-WjLiVOg/edit#heading=h.8a6bhbb6fbdz):<br>
<br>
_“A hotfix is intended to address an issue that is having a critical impact to the production site that must be remediated outside of the normal release schedule. These should very much be the exception, not the rule, but they do come up from time to time and can range from a glaring typo to something that brings down core functionality (e.g., an API endpoint failing).”_<br>
<br>
Hotfixes should only address urgent issues that are determined by project managers to be a critical detriment to production. Otherwise, fixes and updates can be rolled into the next release. If there is a large number of hotfixes needed, the team should consider making an extra mid-sprint mini release instead of deploying several hotfixes.<br>
<br>
A detailed step-by-step guide to creating hotfixes can be found in the [onboarding documentation](https://docs.google.com/document/d/18ZjPvNrdW3wn9pUx7hSNbaMlaEaPPOGzOHh-WjLiVOg/edit#heading=h.8a6bhbb6fbdz).
