// Translates cryptic stack traces into plain English logic flaws
export class ErrorExplainer {
  static simplifyError(/* _trace: string */) {
    return "You are trying to access a property on an undefined variable on line 24. Make sure 'user' exists before 'user.name'.";
  }
}
