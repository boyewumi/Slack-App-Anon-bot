# Code Smells to Look Out for During Code Review

Comprehensive list of code smells that can be used as part code review checklists. When doing code review, make sure that these smells are not part of the code. If you identify a smell within the code make sure to identify it and link it to the developer!

## Inter Class Code Smell

* too many comments
* too little comments where needed
* long methods
* long parameters lists
* duplicate code
* conditional complexity
* tiny variations in almost identical code
* large classes
* bad naming choices
* dead code, classes that don't do anything
* extras that aren't used
* temporary fields
* left-field solutions
* excessively long (or short) identifiers
* returning more data than the caller needs
* long lines of code (long chains of messages)
* using primitives instead of small objects
* using constants instead of enums
* repeated sets of data (like parameters for connecting to a server)
* unused classes/methods/fields as speculative "we might need this" items

## Intra Class Code Smell
* same functionality different interface
* using lists of primitives instead of making a class
* data classes
* not using inherited functionality
* exposing internal data
* using features of another class instead of your own features
* classes that do nothing
* long sequences of messages repeated frequently
* middleman classes
* too many classes to make up a solution

## Change Prevention Smell
* high coupling means a change in one place requires many changes elsewhere
* separate class hierarchies developed in parallel (when you add a class to one you must add a class to another)
* A change in functionality results in gutting a class

## Smell Resulting From High Coupling
* Code that uses data from aggregate classes more than its own
* Classes that only delegate work (except for controller classes, which have a reason for existing)
classes using the data of other classes directly (without accessors and mutator)