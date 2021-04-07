# 0.0.8

### Fixes
* Bug `back()` export

# 0.0.7

### Improvements
* Added `link` and `active` actions
* Improved scroll management

### Breaking changes
* `push()` renamed to `navigate()`
* `Link` component deleted

### Fixes
* Resolved a bug with `blockPageScroll` and nested routes

# 0.0.6

### Improvements
* Moved history route state to `window.history` so that state will be preseved between refreshes
* Renamed `resetScroll` to `scrollToTop`
* Improved scroll management

### Fixes
* Fixed a bug where scroll wasn't restored when going back or forward

# 0.0.5

Query string parameters

# 0.0.4

Better implementation of nested routes.

# 0.0.3

### Fixes
* Circular imports
* `Link` optional props

# 0.0.2

Basic initial features.