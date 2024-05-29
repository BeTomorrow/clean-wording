/*
class Screen extends StatefulWidget {
  const Screen({super.key});

  @override
  State<Screen> createState() => _ScreenState();
}

class _ScreenState extends State<Screen> {
  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Column(children: [
      Text(localizations.wording),
      Text(localizations.wordingWithParameter, {count: 3}),
      Text(localizations.wordingOnlyInProject),
      Text(AppLocalizations.of(context)!.wordingWithNewRegex),
    ]);
  }
}
*/