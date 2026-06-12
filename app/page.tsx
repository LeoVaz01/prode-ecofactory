'use client';

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "./supabaseClient";

/* ============================================================================
   PRODE MUNDIAL 2026 — Fase de grupos + Fase eliminatoria (cruces oficiales FIFA)
   ----------------------------------------------------------------------------
   La matriz THIRD_ALLOCATION reproduce el Anexo C del reglamento FIFA: las 495
   combinaciones posibles de los 8 mejores terceros y a qué ganador de grupo
   enfrenta cada uno en los 16avos de final. Validada: 495 filas, cobertura
   completa de C(12,8), y cada tercero respeta los grupos permitidos de su slot.
   ========================================================================== */

// key   = los 8 grupos (ordenados) cuyos terceros clasifican
// value = grupo del 3.º asignado a [Gana A, Gana B, Gana D, Gana E, Gana G, Gana I, Gana K, Gana L]
const THIRD_ALLOCATION = {
  "ABCDEFGH":"HGBCAFDE",
  "ABCDEFGI":"CGBDAFEI",
  "ABCDEFGJ":"CGBDAFEJ",
  "ABCDEFGK":"CGBDAFEK",
  "ABCDEFGL":"CGBDAFLE",
  "ABCDEFHI":"HEBCAFDI",
  "ABCDEFHJ":"HJBCAFDE",
  "ABCDEFHK":"HEBCAFDK",
  "ABCDEFHL":"HFBCADLE",
  "ABCDEFIJ":"CJBDAFEI",
  "ABCDEFIK":"CEBDAFIK",
  "ABCDEFIL":"CEBDAFLI",
  "ABCDEFJK":"CJBDAFEK",
  "ABCDEFJL":"CJBDAFLE",
  "ABCDEFKL":"CEBDAFLK",
  "ABCDEGHI":"HGBCADEI",
  "ABCDEGHJ":"HGBCADEJ",
  "ABCDEGHK":"HGBCADEK",
  "ABCDEGHL":"HGBCADLE",
  "ABCDEGIJ":"EGBCADIJ",
  "ABCDEGIK":"EGBCADIK",
  "ABCDEGIL":"EGBCADLI",
  "ABCDEGJK":"EGBCADJK",
  "ABCDEGJL":"EGBCADLJ",
  "ABCDEGKL":"EGBCADLK",
  "ABCDEHIJ":"HJBCADEI",
  "ABCDEHIK":"HEBCADIK",
  "ABCDEHIL":"HEBCADLI",
  "ABCDEHJK":"HJBCADEK",
  "ABCDEHJL":"HJBCADLE",
  "ABCDEHKL":"HEBCADLK",
  "ABCDEIJK":"EJBCADIK",
  "ABCDEIJL":"EJBCADLI",
  "ABCDEIKL":"EIBCADLK",
  "ABCDEJKL":"EJBCADLK",
  "ABCDFGHI":"HGBCAFDI",
  "ABCDFGHJ":"HGBCAFDJ",
  "ABCDFGHK":"HGBCAFDK",
  "ABCDFGHL":"CGBDAFLH",
  "ABCDFGIJ":"CGBDAFIJ",
  "ABCDFGIK":"CGBDAFIK",
  "ABCDFGIL":"CGBDAFLI",
  "ABCDFGJK":"CGBDAFJK",
  "ABCDFGJL":"CGBDAFLJ",
  "ABCDFGKL":"CGBDAFLK",
  "ABCDFHIJ":"HJBCAFDI",
  "ABCDFHIK":"HFBCADIK",
  "ABCDFHIL":"HFBCADLI",
  "ABCDFHJK":"HJBCAFDK",
  "ABCDFHJL":"CJBDAFLH",
  "ABCDFHKL":"HFBCADLK",
  "ABCDFIJK":"CJBDAFIK",
  "ABCDFIJL":"CJBDAFLI",
  "ABCDFIKL":"CIBDAFLK",
  "ABCDFJKL":"CJBDAFLK",
  "ABCDGHIJ":"HGBCADIJ",
  "ABCDGHIK":"HGBCADIK",
  "ABCDGHIL":"HGBCADLI",
  "ABCDGHJK":"HGBCADJK",
  "ABCDGHJL":"HGBCADLJ",
  "ABCDGHKL":"HGBCADLK",
  "ABCDGIJK":"CJBDAGIK",
  "ABCDGIJL":"CJBDAGLI",
  "ABCDGIKL":"IGBCADLK",
  "ABCDGJKL":"CJBDAGLK",
  "ABCDHIJK":"HJBCADIK",
  "ABCDHIJL":"HJBCADLI",
  "ABCDHIKL":"HIBCADLK",
  "ABCDHJKL":"HJBCADLK",
  "ABCDIJKL":"IJBCADLK",
  "ABCEFGHI":"HGBCAFEI",
  "ABCEFGHJ":"HGBCAFEJ",
  "ABCEFGHK":"HGBCAFEK",
  "ABCEFGHL":"HGBCAFLE",
  "ABCEFGIJ":"EGBCAFIJ",
  "ABCEFGIK":"EGBCAFIK",
  "ABCEFGIL":"EGBCAFLI",
  "ABCEFGJK":"EGBCAFJK",
  "ABCEFGJL":"EGBCAFLJ",
  "ABCEFGKL":"EGBCAFLK",
  "ABCEFHIJ":"HJBCAFEI",
  "ABCEFHIK":"HEBCAFIK",
  "ABCEFHIL":"HEBCAFLI",
  "ABCEFHJK":"HJBCAFEK",
  "ABCEFHJL":"HJBCAFLE",
  "ABCEFHKL":"HEBCAFLK",
  "ABCEFIJK":"EJBCAFIK",
  "ABCEFIJL":"EJBCAFLI",
  "ABCEFIKL":"EIBCAFLK",
  "ABCEFJKL":"EJBCAFLK",
  "ABCEGHIJ":"HJBCAGEI",
  "ABCEGHIK":"EGBCAHIK",
  "ABCEGHIL":"EGBCAHLI",
  "ABCEGHJK":"HJBCAGEK",
  "ABCEGHJL":"HJBCAGLE",
  "ABCEGHKL":"EGBCAHLK",
  "ABCEGIJK":"EJBCAGIK",
  "ABCEGIJL":"EJBCAGLI",
  "ABCEGIKL":"EGBAICLK",
  "ABCEGJKL":"EJBCAGLK",
  "ABCEHIJK":"EJBCAHIK",
  "ABCEHIJL":"EJBCAHLI",
  "ABCEHIKL":"EIBCAHLK",
  "ABCEHJKL":"EJBCAHLK",
  "ABCEIJKL":"EJBAICLK",
  "ABCFGHIJ":"HGBCAFIJ",
  "ABCFGHIK":"HGBCAFIK",
  "ABCFGHIL":"HGBCAFLI",
  "ABCFGHJK":"HGBCAFJK",
  "ABCFGHJL":"HGBCAFLJ",
  "ABCFGHKL":"HGBCAFLK",
  "ABCFGIJK":"CJBFAGIK",
  "ABCFGIJL":"CJBFAGLI",
  "ABCFGIKL":"IGBCAFLK",
  "ABCFGJKL":"CJBFAGLK",
  "ABCFHIJK":"HJBCAFIK",
  "ABCFHIJL":"HJBCAFLI",
  "ABCFHIKL":"HIBCAFLK",
  "ABCFHJKL":"HJBCAFLK",
  "ABCFIJKL":"IJBCAFLK",
  "ABCGHIJK":"HJBCAGIK",
  "ABCGHIJL":"HJBCAGLI",
  "ABCGHIKL":"IGBCAHLK",
  "ABCGHJKL":"HJBCAGLK",
  "ABCGIJKL":"IJBCAGLK",
  "ABCHIJKL":"IJBCAHLK",
  "ABDEFGHI":"HGBDAFEI",
  "ABDEFGHJ":"HGBDAFEJ",
  "ABDEFGHK":"HGBDAFEK",
  "ABDEFGHL":"HGBDAFLE",
  "ABDEFGIJ":"EGBDAFIJ",
  "ABDEFGIK":"EGBDAFIK",
  "ABDEFGIL":"EGBDAFLI",
  "ABDEFGJK":"EGBDAFJK",
  "ABDEFGJL":"EGBDAFLJ",
  "ABDEFGKL":"EGBDAFLK",
  "ABDEFHIJ":"HJBDAFEI",
  "ABDEFHIK":"HEBDAFIK",
  "ABDEFHIL":"HEBDAFLI",
  "ABDEFHJK":"HJBDAFEK",
  "ABDEFHJL":"HJBDAFLE",
  "ABDEFHKL":"HEBDAFLK",
  "ABDEFIJK":"EJBDAFIK",
  "ABDEFIJL":"EJBDAFLI",
  "ABDEFIKL":"EIBDAFLK",
  "ABDEFJKL":"EJBDAFLK",
  "ABDEGHIJ":"HJBDAGEI",
  "ABDEGHIK":"EGBDAHIK",
  "ABDEGHIL":"EGBDAHLI",
  "ABDEGHJK":"HJBDAGEK",
  "ABDEGHJL":"HJBDAGLE",
  "ABDEGHKL":"EGBDAHLK",
  "ABDEGIJK":"EJBDAGIK",
  "ABDEGIJL":"EJBDAGLI",
  "ABDEGIKL":"EGBAIDLK",
  "ABDEGJKL":"EJBDAGLK",
  "ABDEHIJK":"EJBDAHIK",
  "ABDEHIJL":"EJBDAHLI",
  "ABDEHIKL":"EIBDAHLK",
  "ABDEHJKL":"EJBDAHLK",
  "ABDEIJKL":"EJBAIDLK",
  "ABDFGHIJ":"HGBDAFIJ",
  "ABDFGHIK":"HGBDAFIK",
  "ABDFGHIL":"HGBDAFLI",
  "ABDFGHJK":"HGBDAFJK",
  "ABDFGHJL":"HGBDAFLJ",
  "ABDFGHKL":"HGBDAFLK",
  "ABDFGIJK":"FJBDAGIK",
  "ABDFGIJL":"FJBDAGLI",
  "ABDFGIKL":"IGBDAFLK",
  "ABDFGJKL":"FJBDAGLK",
  "ABDFHIJK":"HJBDAFIK",
  "ABDFHIJL":"HJBDAFLI",
  "ABDFHIKL":"HIBDAFLK",
  "ABDFHJKL":"HJBDAFLK",
  "ABDFIJKL":"IJBDAFLK",
  "ABDGHIJK":"HJBDAGIK",
  "ABDGHIJL":"HJBDAGLI",
  "ABDGHIKL":"IGBDAHLK",
  "ABDGHJKL":"HJBDAGLK",
  "ABDGIJKL":"IJBDAGLK",
  "ABDHIJKL":"IJBDAHLK",
  "ABEFGHIJ":"HJBFAGEI",
  "ABEFGHIK":"EGBFAHIK",
  "ABEFGHIL":"EGBFAHLI",
  "ABEFGHJK":"HJBFAGEK",
  "ABEFGHJL":"HJBFAGLE",
  "ABEFGHKL":"EGBFAHLK",
  "ABEFGIJK":"EJBFAGIK",
  "ABEFGIJL":"EJBFAGLI",
  "ABEFGIKL":"EGBAIFLK",
  "ABEFGJKL":"EJBFAGLK",
  "ABEFHIJK":"EJBFAHIK",
  "ABEFHIJL":"EJBFAHLI",
  "ABEFHIKL":"EIBFAHLK",
  "ABEFHJKL":"EJBFAHLK",
  "ABEFIJKL":"EJBAIFLK",
  "ABEGHIJK":"EJBAHGIK",
  "ABEGHIJL":"EJBAHGLI",
  "ABEGHIKL":"EGBAIHLK",
  "ABEGHJKL":"EJBAHGLK",
  "ABEGIJKL":"EJBAIGLK",
  "ABEHIJKL":"EJBAIHLK",
  "ABFGHIJK":"HJBFAGIK",
  "ABFGHIJL":"HJBFAGLI",
  "ABFGHIKL":"HGBAIFLK",
  "ABFGHJKL":"HJBFAGLK",
  "ABFGIJKL":"IJBFAGLK",
  "ABFHIJKL":"HJBAIFLK",
  "ABGHIJKL":"HJBAIGLK",
  "ACDEFGHI":"HGECAFDI",
  "ACDEFGHJ":"HGJCAFDE",
  "ACDEFGHK":"HGECAFDK",
  "ACDEFGHL":"HGFCADLE",
  "ACDEFGIJ":"CGJDAFEI",
  "ACDEFGIK":"CGEDAFIK",
  "ACDEFGIL":"CGEDAFLI",
  "ACDEFGJK":"CGJDAFEK",
  "ACDEFGJL":"CGJDAFLE",
  "ACDEFGKL":"CGEDAFLK",
  "ACDEFHIJ":"HJECAFDI",
  "ACDEFHIK":"HEFCADIK",
  "ACDEFHIL":"HEFCADLI",
  "ACDEFHJK":"HJECAFDK",
  "ACDEFHJL":"HJFCADLE",
  "ACDEFHKL":"HEFCADLK",
  "ACDEFIJK":"CJEDAFIK",
  "ACDEFIJL":"CJEDAFLI",
  "ACDEFIKL":"CEIDAFLK",
  "ACDEFJKL":"CJEDAFLK",
  "ACDEGHIJ":"HGJCADEI",
  "ACDEGHIK":"HGECADIK",
  "ACDEGHIL":"HGECADLI",
  "ACDEGHJK":"HGJCADEK",
  "ACDEGHJL":"HGJCADLE",
  "ACDEGHKL":"HGECADLK",
  "ACDEGIJK":"EGJCADIK",
  "ACDEGIJL":"EGJCADLI",
  "ACDEGIKL":"EGICADLK",
  "ACDEGJKL":"EGJCADLK",
  "ACDEHIJK":"HJECADIK",
  "ACDEHIJL":"HJECADLI",
  "ACDEHIKL":"HEICADLK",
  "ACDEHJKL":"HJECADLK",
  "ACDEIJKL":"EJICADLK",
  "ACDFGHIJ":"HGJCAFDI",
  "ACDFGHIK":"HGFCADIK",
  "ACDFGHIL":"HGFCADLI",
  "ACDFGHJK":"HGJCAFDK",
  "ACDFGHJL":"CGJDAFLH",
  "ACDFGHKL":"HGFCADLK",
  "ACDFGIJK":"CGJDAFIK",
  "ACDFGIJL":"CGJDAFLI",
  "ACDFGIKL":"CGIDAFLK",
  "ACDFGJKL":"CGJDAFLK",
  "ACDFHIJK":"HJFCADIK",
  "ACDFHIJL":"HJFCADLI",
  "ACDFHIKL":"HFICADLK",
  "ACDFHJKL":"HJFCADLK",
  "ACDFIJKL":"CJIDAFLK",
  "ACDGHIJK":"HGJCADIK",
  "ACDGHIJL":"HGJCADLI",
  "ACDGHIKL":"HGICADLK",
  "ACDGHJKL":"HGJCADLK",
  "ACDGIJKL":"IGJCADLK",
  "ACDHIJKL":"HJICADLK",
  "ACEFGHIJ":"HGJCAFEI",
  "ACEFGHIK":"HGECAFIK",
  "ACEFGHIL":"HGECAFLI",
  "ACEFGHJK":"HGJCAFEK",
  "ACEFGHJL":"HGJCAFLE",
  "ACEFGHKL":"HGECAFLK",
  "ACEFGIJK":"EGJCAFIK",
  "ACEFGIJL":"EGJCAFLI",
  "ACEFGIKL":"EGICAFLK",
  "ACEFGJKL":"EGJCAFLK",
  "ACEFHIJK":"HJECAFIK",
  "ACEFHIJL":"HJECAFLI",
  "ACEFHIKL":"HEICAFLK",
  "ACEFHJKL":"HJECAFLK",
  "ACEFIJKL":"EJICAFLK",
  "ACEGHIJK":"EGJCAHIK",
  "ACEGHIJL":"EGJCAHLI",
  "ACEGHIKL":"EGICAHLK",
  "ACEGHJKL":"EGJCAHLK",
  "ACEGIJKL":"EJICAGLK",
  "ACEHIJKL":"EJICAHLK",
  "ACFGHIJK":"HGJCAFIK",
  "ACFGHIJL":"HGJCAFLI",
  "ACFGHIKL":"HGICAFLK",
  "ACFGHJKL":"HGJCAFLK",
  "ACFGIJKL":"IGJCAFLK",
  "ACFHIJKL":"HJICAFLK",
  "ACGHIJKL":"HJICAGLK",
  "ADEFGHIJ":"HGJDAFEI",
  "ADEFGHIK":"HGEDAFIK",
  "ADEFGHIL":"HGEDAFLI",
  "ADEFGHJK":"HGJDAFEK",
  "ADEFGHJL":"HGJDAFLE",
  "ADEFGHKL":"HGEDAFLK",
  "ADEFGIJK":"EGJDAFIK",
  "ADEFGIJL":"EGJDAFLI",
  "ADEFGIKL":"EGIDAFLK",
  "ADEFGJKL":"EGJDAFLK",
  "ADEFHIJK":"HJEDAFIK",
  "ADEFHIJL":"HJEDAFLI",
  "ADEFHIKL":"HEIDAFLK",
  "ADEFHJKL":"HJEDAFLK",
  "ADEFIJKL":"EJIDAFLK",
  "ADEGHIJK":"EGJDAHIK",
  "ADEGHIJL":"EGJDAHLI",
  "ADEGHIKL":"EGIDAHLK",
  "ADEGHJKL":"EGJDAHLK",
  "ADEGIJKL":"EJIDAGLK",
  "ADEHIJKL":"EJIDAHLK",
  "ADFGHIJK":"HGJDAFIK",
  "ADFGHIJL":"HGJDAFLI",
  "ADFGHIKL":"HGIDAFLK",
  "ADFGHJKL":"HGJDAFLK",
  "ADFGIJKL":"IGJDAFLK",
  "ADFHIJKL":"HJIDAFLK",
  "ADGHIJKL":"HJIDAGLK",
  "AEFGHIJK":"EGJFAHIK",
  "AEFGHIJL":"EGJFAHLI",
  "AEFGHIKL":"EGIFAHLK",
  "AEFGHJKL":"EGJFAHLK",
  "AEFGIJKL":"EJIFAGLK",
  "AEFHIJKL":"EJIFAHLK",
  "AEGHIJKL":"EJIAHGLK",
  "AFGHIJKL":"HJIFAGLK",
  "BCDEFGHI":"CGBDHFEI",
  "BCDEFGHJ":"HGBCJFDE",
  "BCDEFGHK":"CGBDHFEK",
  "BCDEFGHL":"CGBDHFLE",
  "BCDEFGIJ":"CGBDJFEI",
  "BCDEFGIK":"CGBDEFIK",
  "BCDEFGIL":"CGBDEFLI",
  "BCDEFGJK":"CGBDJFEK",
  "BCDEFGJL":"CGBDJFLE",
  "BCDEFGKL":"CGBDEFLK",
  "BCDEFHIJ":"CJBDHFEI",
  "BCDEFHIK":"CEBDHFIK",
  "BCDEFHIL":"CEBDHFLI",
  "BCDEFHJK":"CJBDHFEK",
  "BCDEFHJL":"CJBDHFLE",
  "BCDEFHKL":"CEBDHFLK",
  "BCDEFIJK":"CJBDEFIK",
  "BCDEFIJL":"CJBDEFLI",
  "BCDEFIKL":"CEBDIFLK",
  "BCDEFJKL":"CJBDEFLK",
  "BCDEGHIJ":"HGBCJDEI",
  "BCDEGHIK":"EGBCHDIK",
  "BCDEGHIL":"EGBCHDLI",
  "BCDEGHJK":"HGBCJDEK",
  "BCDEGHJL":"HGBCJDLE",
  "BCDEGHKL":"EGBCHDLK",
  "BCDEGIJK":"EGBCJDIK",
  "BCDEGIJL":"EGBCJDLI",
  "BCDEGIKL":"EGBCIDLK",
  "BCDEGJKL":"EGBCJDLK",
  "BCDEHIJK":"EJBCHDIK",
  "BCDEHIJL":"EJBCHDLI",
  "BCDEHIKL":"EIBCHDLK",
  "BCDEHJKL":"EJBCHDLK",
  "BCDEIJKL":"EJBCIDLK",
  "BCDFGHIJ":"HGBCJFDI",
  "BCDFGHIK":"CGBDHFIK",
  "BCDFGHIL":"CGBDHFLI",
  "BCDFGHJK":"HGBCJFDK",
  "BCDFGHJL":"CGBDHFLJ",
  "BCDFGHKL":"CGBDHFLK",
  "BCDFGIJK":"CGBDJFIK",
  "BCDFGIJL":"CGBDJFLI",
  "BCDFGIKL":"CGBDIFLK",
  "BCDFGJKL":"CGBDJFLK",
  "BCDFHIJK":"CJBDHFIK",
  "BCDFHIJL":"CJBDHFLI",
  "BCDFHIKL":"CIBDHFLK",
  "BCDFHJKL":"CJBDHFLK",
  "BCDFIJKL":"CJBDIFLK",
  "BCDGHIJK":"HGBCJDIK",
  "BCDGHIJL":"HGBCJDLI",
  "BCDGHIKL":"HGBCIDLK",
  "BCDGHJKL":"HGBCJDLK",
  "BCDGIJKL":"IGBCJDLK",
  "BCDHIJKL":"HJBCIDLK",
  "BCEFGHIJ":"HGBCJFEI",
  "BCEFGHIK":"EGBCHFIK",
  "BCEFGHIL":"EGBCHFLI",
  "BCEFGHJK":"HGBCJFEK",
  "BCEFGHJL":"HGBCJFLE",
  "BCEFGHKL":"EGBCHFLK",
  "BCEFGIJK":"EGBCJFIK",
  "BCEFGIJL":"EGBCJFLI",
  "BCEFGIKL":"EGBCIFLK",
  "BCEFGJKL":"EGBCJFLK",
  "BCEFHIJK":"EJBCHFIK",
  "BCEFHIJL":"EJBCHFLI",
  "BCEFHIKL":"EIBCHFLK",
  "BCEFHJKL":"EJBCHFLK",
  "BCEFIJKL":"EJBCIFLK",
  "BCEGHIJK":"EJBCHGIK",
  "BCEGHIJL":"EJBCHGLI",
  "BCEGHIKL":"EGBCIHLK",
  "BCEGHJKL":"EJBCHGLK",
  "BCEGIJKL":"EJBCIGLK",
  "BCEHIJKL":"EJBCIHLK",
  "BCFGHIJK":"HGBCJFIK",
  "BCFGHIJL":"HGBCJFLI",
  "BCFGHIKL":"HGBCIFLK",
  "BCFGHJKL":"HGBCJFLK",
  "BCFGIJKL":"IGBCJFLK",
  "BCFHIJKL":"HJBCIFLK",
  "BCGHIJKL":"HJBCIGLK",
  "BDEFGHIJ":"HGBDJFEI",
  "BDEFGHIK":"EGBDHFIK",
  "BDEFGHIL":"EGBDHFLI",
  "BDEFGHJK":"HGBDJFEK",
  "BDEFGHJL":"HGBDJFLE",
  "BDEFGHKL":"EGBDHFLK",
  "BDEFGIJK":"EGBDJFIK",
  "BDEFGIJL":"EGBDJFLI",
  "BDEFGIKL":"EGBDIFLK",
  "BDEFGJKL":"EGBDJFLK",
  "BDEFHIJK":"EJBDHFIK",
  "BDEFHIJL":"EJBDHFLI",
  "BDEFHIKL":"EIBDHFLK",
  "BDEFHJKL":"EJBDHFLK",
  "BDEFIJKL":"EJBDIFLK",
  "BDEGHIJK":"EJBDHGIK",
  "BDEGHIJL":"EJBDHGLI",
  "BDEGHIKL":"EGBDIHLK",
  "BDEGHJKL":"EJBDHGLK",
  "BDEGIJKL":"EJBDIGLK",
  "BDEHIJKL":"EJBDIHLK",
  "BDFGHIJK":"HGBDJFIK",
  "BDFGHIJL":"HGBDJFLI",
  "BDFGHIKL":"HGBDIFLK",
  "BDFGHJKL":"HGBDJFLK",
  "BDFGIJKL":"IGBDJFLK",
  "BDFHIJKL":"HJBDIFLK",
  "BDGHIJKL":"HJBDIGLK",
  "BEFGHIJK":"EJBFHGIK",
  "BEFGHIJL":"EJBFHGLI",
  "BEFGHIKL":"EGBFIHLK",
  "BEFGHJKL":"EJBFHGLK",
  "BEFGIJKL":"EJBFIGLK",
  "BEFHIJKL":"EJBFIHLK",
  "BEGHIJKL":"EJIBHGLK",
  "BFGHIJKL":"HJBFIGLK",
  "CDEFGHIJ":"CGJDHFEI",
  "CDEFGHIK":"CGEDHFIK",
  "CDEFGHIL":"CGEDHFLI",
  "CDEFGHJK":"CGJDHFEK",
  "CDEFGHJL":"CGJDHFLE",
  "CDEFGHKL":"CGEDHFLK",
  "CDEFGIJK":"CGEDJFIK",
  "CDEFGIJL":"CGEDJFLI",
  "CDEFGIKL":"CGEDIFLK",
  "CDEFGJKL":"CGEDJFLK",
  "CDEFHIJK":"CJEDHFIK",
  "CDEFHIJL":"CJEDHFLI",
  "CDEFHIKL":"CEIDHFLK",
  "CDEFHJKL":"CJEDHFLK",
  "CDEFIJKL":"CJEDIFLK",
  "CDEGHIJK":"EGJCHDIK",
  "CDEGHIJL":"EGJCHDLI",
  "CDEGHIKL":"EGICHDLK",
  "CDEGHJKL":"EGJCHDLK",
  "CDEGIJKL":"EGICJDLK",
  "CDEHIJKL":"EJICHDLK",
  "CDFGHIJK":"CGJDHFIK",
  "CDFGHIJL":"CGJDHFLI",
  "CDFGHIKL":"CGIDHFLK",
  "CDFGHJKL":"CGJDHFLK",
  "CDFGIJKL":"CGIDJFLK",
  "CDFHIJKL":"CJIDHFLK",
  "CDGHIJKL":"HGICJDLK",
  "CEFGHIJK":"EGJCHFIK",
  "CEFGHIJL":"EGJCHFLI",
  "CEFGHIKL":"EGICHFLK",
  "CEFGHJKL":"EGJCHFLK",
  "CEFGIJKL":"EGICJFLK",
  "CEFHIJKL":"EJICHFLK",
  "CEGHIJKL":"EJICHGLK",
  "CFGHIJKL":"HGICJFLK",
  "DEFGHIJK":"EGJDHFIK",
  "DEFGHIJL":"EGJDHFLI",
  "DEFGHIKL":"EGIDHFLK",
  "DEFGHJKL":"EGJDHFLK",
  "DEFGIJKL":"EGIDJFLK",
  "DEFHIJKL":"EJIDHFLK",
  "DEGHIJKL":"EJIDHGLK",
  "DFGHIJKL":"HGIDJFLK",
  "EFGHIJKL":"EJIFHGLK",
};

/* ----------------------------- DATOS DEL TORNEO --------------------------- */

const GROUP_IDS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// id -> { nombre, bandera, grupo }
const TEAMS = {
  MEX:{n:"México",f:"🇲🇽"}, RSA:{n:"Sudáfrica",f:"🇿🇦"}, KOR:{n:"Corea del Sur",f:"🇰🇷"}, CZE:{n:"Chequia",f:"🇨🇿"},
  CAN:{n:"Canadá",f:"🇨🇦"}, SUI:{n:"Suiza",f:"🇨🇭"}, QAT:{n:"Catar",f:"🇶🇦"}, BIH:{n:"Bosnia",f:"🇧🇦"},
  BRA:{n:"Brasil",f:"🇧🇷"}, MAR:{n:"Marruecos",f:"🇲🇦"}, SCO:{n:"Escocia",f:"🏴"}, HAI:{n:"Haití",f:"🇭🇹"},
  USA:{n:"Estados Unidos",f:"🇺🇸"}, PAR:{n:"Paraguay",f:"🇵🇾"}, AUS:{n:"Australia",f:"🇦🇺"}, TUR:{n:"Turquía",f:"🇹🇷"},
  GER:{n:"Alemania",f:"🇩🇪"}, ECU:{n:"Ecuador",f:"🇪🇨"}, CIV:{n:"Costa de Marfil",f:"🇨🇮"}, CUW:{n:"Curazao",f:"🇨🇼"},
  NED:{n:"Países Bajos",f:"🇳🇱"}, JPN:{n:"Japón",f:"🇯🇵"}, TUN:{n:"Túnez",f:"🇹🇳"}, SWE:{n:"Suecia",f:"🇸🇪"},
  BEL:{n:"Bélgica",f:"🇧🇪"}, EGY:{n:"Egipto",f:"🇪🇬"}, IRN:{n:"Irán",f:"🇮🇷"}, NZL:{n:"Nueva Zelanda",f:"🇳🇿"},
  ESP:{n:"España",f:"🇪🇸"}, URU:{n:"Uruguay",f:"🇺🇾"}, KSA:{n:"Arabia Saudita",f:"🇸🇦"}, CPV:{n:"Cabo Verde",f:"🇨🇻"},
  FRA:{n:"Francia",f:"🇫🇷"}, SEN:{n:"Senegal",f:"🇸🇳"}, NOR:{n:"Noruega",f:"🇳🇴"}, IRQ:{n:"Irak",f:"🇮🇶"},
  ARG:{n:"Argentina",f:"🇦🇷"}, AUT:{n:"Austria",f:"🇦🇹"}, ALG:{n:"Argelia",f:"🇩🇿"}, JOR:{n:"Jordania",f:"🇯🇴"},
  POR:{n:"Portugal",f:"🇵🇹"}, COL:{n:"Colombia",f:"🇨🇴"}, UZB:{n:"Uzbekistán",f:"🇺🇿"}, COD:{n:"RD Congo",f:"🇨🇩"},
  ENG:{n:"Inglaterra",f:"🏴"}, CRO:{n:"Croacia",f:"🇭🇷"}, GHA:{n:"Ghana",f:"🇬🇭"}, PAN:{n:"Panamá",f:"🇵🇦"},
};

const GROUPS = {
  A:["MEX","RSA","KOR","CZE"], B:["CAN","SUI","QAT","BIH"],
  C:["BRA","MAR","SCO","HAI"], D:["USA","PAR","AUS","TUR"],
  E:["GER","ECU","CIV","CUW"], F:["NED","JPN","TUN","SWE"],
  G:["BEL","EGY","IRN","NZL"], H:["ESP","URU","KSA","CPV"],
  I:["FRA","SEN","NOR","IRQ"], J:["ARG","AUT","ALG","JOR"],
  K:["POR","COL","UZB","COD"], L:["ENG","CRO","GHA","PAN"],
};
GROUP_IDS.forEach(g => GROUPS[g].forEach(t => { TEAMS[t].g = g; }));

const tn = id => (id && TEAMS[id]) ? `${TEAMS[id].f} ${TEAMS[id].n}` : "";

/* --------------------------- LÓGICA: PARTIDOS ----------------------------- */

function generateGroupMatches() {
  const ms = [];
  const order = [[0,1],[2,3],[0,2],[1,3],[3,0],[1,2]]; // 6 partidos por grupo
  for (const g of GROUP_IDS) {
    const t = GROUPS[g];
    order.forEach(([i,j],k) => ms.push({ id:`G-${g}-${k+1}`, group:g, home:t[i], away:t[j] }));
  }
  return ms; // 72 partidos
}

// Posiciones con desempates FIFA: pts, DG, GF, mano a mano (pts/DG/GF), sorteo (estable)
function standings(group, scores) {
  const teams = GROUPS[group];
  const st = {};
  teams.forEach(t => st[t] = { team:t, pld:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 });
  const played = [];
  for (const g of GROUP_IDS) {} // noop
  const groupMatches = generateGroupMatches().filter(m => m.group === group);
  for (const m of groupMatches) {
    const s = scores[m.id];
    if (!s || s.hs == null || s.as == null) continue;
    const h = st[m.home], a = st[m.away], hs = s.hs, as = s.as;
    h.pld++; a.pld++; h.gf += hs; h.ga += as; a.gf += as; a.ga += hs;
    if (hs > as) { h.w++; a.l++; h.pts += 3; }
    else if (hs < as) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
    played.push({ home:m.home, away:m.away, hs, as });
  }
  Object.values(st).forEach(s => s.gd = s.gf - s.ga);
  const h2h = (set) => {
    const r = {}; set.forEach(t => r[t] = { pts:0,gf:0,ga:0,gd:0 });
    for (const m of played) if (set.includes(m.home) && set.includes(m.away)) {
      r[m.home].gf += m.hs; r[m.home].ga += m.as; r[m.away].gf += m.as; r[m.away].ga += m.hs;
      if (m.hs > m.as) r[m.home].pts += 3; else if (m.hs < m.as) r[m.away].pts += 3;
      else { r[m.home].pts++; r[m.away].pts++; }
    }
    set.forEach(t => r[t].gd = r[t].gf - r[t].ga);
    return r;
  };
  return Object.values(st).sort((x,y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
    const r = h2h([x.team,y.team]);
    if (r[y.team].pts !== r[x.team].pts) return r[y.team].pts - r[x.team].pts;
    if (r[y.team].gd !== r[x.team].gd) return r[y.team].gd - r[x.team].gd;
    if (r[y.team].gf !== r[x.team].gf) return r[y.team].gf - r[x.team].gf;
    return teams.indexOf(x.team) - teams.indexOf(y.team);
  });
}

const groupComplete = (group, scores) =>
  generateGroupMatches().filter(m => m.group === group)
    .every(m => scores[m.id] && scores[m.id].hs != null && scores[m.id].as != null);

const allGroupsComplete = (scores) => GROUP_IDS.every(g => groupComplete(g, scores));

// 8 mejores terceros: pts, DG, GF, (sorteo estable)
function bestThirds(allStand) {
  const thirds = GROUP_IDS.map(g => ({ group:g, ...allStand[g][2] }));
  thirds.sort((x,y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.group.localeCompare(y.group));
  return thirds.slice(0,8);
}

// Construye los 16 partidos de 16avos aplicando la matriz oficial
function buildR32(allStand) {
  const W = g => allStand[g][0].team, R = g => allStand[g][1].team, T = g => allStand[g][2].team;
  const thirds = bestThirds(allStand);
  const key = thirds.map(t => t.group).sort().join("");
  const alloc = THIRD_ALLOCATION[key];
  const [aA,aB,aD,aE,aG,aI,aK,aL] = alloc.split("");
  // notas de slot (qué grupos pueden caer en cada cruce de 3.º)
  return [
    { id:"M73", n:73, t1:R("A"), t2:R("B"), l1:"2.º A", l2:"2.º B" },
    { id:"M74", n:74, t1:W("E"), t2:T(aE), l1:"1.º E", l2:"3.º A/B/C/D/F" },
    { id:"M75", n:75, t1:W("F"), t2:R("C"), l1:"1.º F", l2:"2.º C" },
    { id:"M76", n:76, t1:W("C"), t2:R("F"), l1:"1.º C", l2:"2.º F" },
    { id:"M77", n:77, t1:W("I"), t2:T(aI), l1:"1.º I", l2:"3.º C/D/F/G/H" },
    { id:"M78", n:78, t1:R("E"), t2:R("I"), l1:"2.º E", l2:"2.º I" },
    { id:"M79", n:79, t1:W("A"), t2:T(aA), l1:"1.º A", l2:"3.º C/E/F/H/I" },
    { id:"M80", n:80, t1:W("L"), t2:T(aL), l1:"1.º L", l2:"3.º E/H/I/J/K" },
    { id:"M81", n:81, t1:W("D"), t2:T(aD), l1:"1.º D", l2:"3.º B/E/F/I/J" },
    { id:"M82", n:82, t1:W("G"), t2:T(aG), l1:"1.º G", l2:"3.º A/E/H/I/J" },
    { id:"M83", n:83, t1:R("K"), t2:R("L"), l1:"2.º K", l2:"2.º L" },
    { id:"M84", n:84, t1:W("H"), t2:R("J"), l1:"1.º H", l2:"2.º J" },
    { id:"M85", n:85, t1:W("B"), t2:T(aB), l1:"1.º B", l2:"3.º E/F/G/I/J" },
    { id:"M86", n:86, t1:W("J"), t2:R("H"), l1:"1.º J", l2:"2.º H" },
    { id:"M87", n:87, t1:W("K"), t2:T(aK), l1:"1.º K", l2:"3.º D/E/I/J/L" },
    { id:"M88", n:88, t1:R("D"), t2:R("G"), l1:"2.º D", l2:"2.º G" },
  ];
}

// Fuentes de cada slot en rondas posteriores (W=ganador, L=perdedor)
const SLOTS = {
  M89:["W74","W77"], M90:["W73","W75"], M91:["W76","W78"], M92:["W79","W80"],
  M93:["W83","W84"], M94:["W81","W82"], M95:["W86","W88"], M96:["W85","W87"],
  M97:["W89","W90"], M98:["W93","W94"], M99:["W91","W92"], M100:["W95","W96"],
  M101:["W97","W98"], M102:["W99","W100"],
  M103:["L101","L102"], M104:["W101","W102"],
};
const META = {
  M89:{n:89,r:"R16"}, M90:{n:90,r:"R16"}, M91:{n:91,r:"R16"}, M92:{n:92,r:"R16"},
  M93:{n:93,r:"R16"}, M94:{n:94,r:"R16"}, M95:{n:95,r:"R16"}, M96:{n:96,r:"R16"},
  M97:{n:97,r:"QF"}, M98:{n:98,r:"QF"}, M99:{n:99,r:"QF"}, M100:{n:100,r:"QF"},
  M101:{n:101,r:"SF"}, M102:{n:102,r:"SF"}, M103:{n:103,r:"3P"}, M104:{n:104,r:"F"},
};
const KO_ORDER = ["M89","M90","M91","M92","M93","M94","M95","M96","M97","M98","M99","M100","M101","M102","M103","M104"];

// Resuelve los dos equipos de un partido a partir de 16avos + las elecciones (ganadores)
function resolveTeams(matchId, r32map, picks) {
  if (r32map[matchId]) return [r32map[matchId].t1, r32map[matchId].t2];
  const src = SLOTS[matchId];
  return src.map(s => {
    const wm = "M" + s.slice(1);
    const w = picks[wm];
    if (!w) return null;
    const [a,b] = resolveTeams(wm, r32map, picks);
    if (a == null || b == null) return null;
    if (s[0] === "W") return (w === a || w === b) ? w : null;
    return w === a ? b : (w === b ? a : null); // perdedor
  });
}

/* ========== CAPA DE DATOS — CONEXIÓN A SUPABASE (vía funciones seguras RPC) ==========
   Estas funciones llaman a funciones SQL creadas en Supabase (ver el bloque SQL
   que te pasé). Así el padrón de empleados NO queda expuesto públicamente y el
   servidor valida la fecha de corte y el "una sola vez".
   ==================================================================================== */

const DEADLINE = new Date("2026-06-11T16:00:00-03:00");
const prodeCerrado = () => Date.now() >= DEADLINE.getTime();

async function buscarEmpleado(dni) {
  const d = String(dni).trim();
  const { data, error } = await supabase.rpc("validar_empleado", { p_dni: d });
  if (error) { console.error(error); throw error; }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { dni: d, nombre: row.nombre, apellido: row.apellido } : null;
}

async function consultarEnvio(dni) {
  const { data, error } = await supabase.rpc("ya_envio", { p_dni: String(dni).trim() });
  if (error) { console.error(error); throw error; }
  return { enviado: !!data };
}

async function savePrediction(payload) {
  const { error } = await supabase.rpc("guardar_prediccion", {
    p_dni: payload.dni,
    p_predicciones: payload.predicciones,
    p_campeon: payload?.predicciones?.fase_eliminatoria?.campeon || null,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("DNI_YA_ENVIO")) throw new Error("DNI_YA_ENVIO");
    if (msg.includes("PRODE_CERRADO")) throw new Error("PRODE_CERRADO");
    if (msg.includes("DNI_NO_HABILITADO")) throw new Error("DNI_NO_HABILITADO");
    console.error(error);
    throw error;
  }
  return { ok: true };
}

// Trae el pronóstico ya guardado de un DNI (para verlo en modo solo-lectura).
async function obtenerPrediccion(dni) {
  const { data, error } = await supabase.rpc("obtener_prediccion", { p_dni: String(dni).trim() });
  if (error) { console.error(error); throw error; }
  return Array.isArray(data) ? (data[0] || null) : (data || null);
}
/* ------------------------------- UI: ÁTOMOS ------------------------------- */

const ROUND_TITLES = { R32:"16avos de final", R16:"Octavos de final", QF:"Cuartos de final", SF:"Semifinales", "3P":"Tercer puesto", F:"Final" };

function ScoreBox({ value, onChange, disabled }) {
  return (
    <input
      type="number" min="0" inputMode="numeric"
      value={value == null ? "" : value}
      disabled={disabled}
      onChange={e => {
        const v = e.target.value;
        onChange(v === "" ? null : Math.max(0, Math.min(99, parseInt(v,10) || 0)));
      }}
      className="w-10 h-10 text-center rounded-md bg-slate-800 text-white font-bold border border-slate-600 focus:border-emerald-400 focus:outline-none"
    />
  );
}

function MatchRow({ home, away, score, onScore }) {
  const s = score || { hs:null, as:null };
  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-900 border border-slate-800">
      <span className="flex-1 text-right text-sm text-slate-100 truncate">{tn(home)}</span>
      <ScoreBox value={s.hs} onChange={v => onScore({ hs:v, as:s.as })} />
      <span className="text-slate-500 text-xs">–</span>
      <ScoreBox value={s.as} onChange={v => onScore({ hs:s.hs, as:v })} />
      <span className="flex-1 text-left text-sm text-slate-100 truncate">{tn(away)}</span>
    </div>
  );
}

/* --------------------------- UI: FASE DE GRUPOS --------------------------- */

function GroupCard({ group, scores, setScore, standing }) {
  const matches = useMemo(() => generateGroupMatches().filter(m => m.group === group), [group]);
  const done = groupComplete(group, scores);
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <h3 className="font-bold text-emerald-400 tracking-wide">Grupo {group}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${done ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-300"}`}>
          {done ? "Completo" : "Pendiente"}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {matches.map(m => (
          <MatchRow key={m.id} home={m.home} away={m.away}
            score={scores[m.id]} onScore={s => setScore(m.id, s)} />
        ))}
      </div>
      <div className="px-3 pb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-medium py-1">#</th>
              <th className="text-left font-medium">Equipo</th>
              <th className="text-center font-medium">Pts</th>
              <th className="text-center font-medium">DG</th>
              <th className="text-center font-medium">GF</th>
            </tr>
          </thead>
          <tbody>
            {standing.map((s,i) => (
              <tr key={s.team} className={i < 2 ? "text-emerald-300" : i === 2 ? "text-amber-300" : "text-slate-500"}>
                <td className="py-0.5">{i+1}</td>
                <td className="truncate">{tn(s.team)}</td>
                <td className="text-center font-bold">{s.pts}</td>
                <td className="text-center">{s.gd > 0 ? "+" : ""}{s.gd}</td>
                <td className="text-center">{s.gf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupStage({ scores, setScore, allStand, complete, onContinue }) {
  const filledCount = useMemo(() =>
    generateGroupMatches().filter(m => scores[m.id] && scores[m.id].hs != null && scores[m.id].as != null).length, [scores]);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Fase de Grupos</h2>
          <p className="text-sm text-slate-400">{filledCount}/72 partidos cargados · 2 verdes clasifican + mejores terceros</p>
        </div>
        <button onClick={onContinue} disabled={!complete}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${complete ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>
          Ir a Eliminatorias →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUP_IDS.map(g => (
          <GroupCard key={g} group={g} scores={scores} setScore={setScore} standing={allStand[g]} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------- UI: FASE ELIMINATORIA -------------------------- */

function slotLabel(src, r32map, baseMatch, side) {
  if (baseMatch) return side === 0 ? baseMatch.l1 : baseMatch.l2;
  const num = src.slice(1);
  return src[0] === "W" ? `Ganador ${num}` : `Perdedor ${num}`;
}

function KOTeamButton({ team, label, selected, dim, onClick }) {
  const clickable = !!team && !!onClick;
  return (
    <button
      disabled={!clickable}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors
        ${selected ? "bg-emerald-500 text-slate-950 font-bold"
          : team ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
          : "bg-slate-900 text-slate-600"}
        ${dim && !selected ? "opacity-50" : ""}`}>
      <span className="truncate">{team ? tn(team) : label}</span>
    </button>
  );
}

function KOMatch({ id, n, teams, pick, onPick, srcs, baseMatch, isFinal, dim }) {
  const [a,b] = teams;
  const decided = pick != null;
  return (
    <div className={`rounded-xl border p-2 w-56 ${isFinal ? "border-amber-400 bg-slate-900" : "border-slate-800 bg-slate-950"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Partido {n}</span>
        {isFinal && <span className="text-[10px] text-amber-400 font-bold">🏆 FINAL</span>}
      </div>
      <div className="space-y-1">
        <KOTeamButton team={a} label={slotLabel(srcs[0], null, baseMatch, 0)}
          selected={decided && pick === a} dim={dim}
          onClick={a ? () => onPick(id, pick === a ? null : a) : null} />
        <KOTeamButton team={b} label={slotLabel(srcs[1], null, baseMatch, 1)}
          selected={decided && pick === b} dim={dim}
          onClick={b ? () => onPick(id, pick === b ? null : b) : null} />
      </div>
    </div>
  );
}

function RoundColumn({ title, children }) {
  return (
    <div className="flex flex-col gap-3 shrink-0">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">{title}</h4>
      <div className="flex flex-col gap-3 justify-around h-full">{children}</div>
    </div>
  );
}

function KnockoutStage({ r32, r32map, picks, onPick, onBack }) {
  const teamsOf = id => r32map[id] ? [r32map[id].t1, r32map[id].t2] : resolveTeams(id, r32map, picks);
  const srcsOf = id => r32map[id] ? [r32map[id].l1 && "X", "X"] : SLOTS[id];

  const r16 = ["M89","M90","M91","M92","M93","M94","M95","M96"];
  const qf  = ["M97","M98","M99","M100"];
  const sf  = ["M101","M102"];

  const renderKO = (id) => (
    <KOMatch key={id} id={id} n={META[id].n} teams={resolveTeams(id, r32map, picks)}
      pick={picks[id] ?? null} onPick={onPick} srcs={SLOTS[id]} isFinal={id === "M104"} />
  );

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Fase Eliminatoria</h2>
          <p className="text-sm text-slate-400">Tocá el equipo que avanza en cada cruce. Cruces según matriz oficial FIFA.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-800 text-slate-200 hover:bg-slate-700">← Grupos</button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max items-stretch">
          <RoundColumn title="16avos">
            {r32.map(m => (
              <KOMatch key={m.id} id={m.id} n={m.n} teams={[m.t1, m.t2]}
                pick={picks[m.id] ?? null} onPick={onPick}
                srcs={["X","X"]} baseMatch={m} />
            ))}
          </RoundColumn>
          <RoundColumn title="Octavos">{r16.map(renderKO)}</RoundColumn>
          <RoundColumn title="Cuartos">{qf.map(renderKO)}</RoundColumn>
          <RoundColumn title="Semis">{sf.map(renderKO)}</RoundColumn>
          <RoundColumn title="Final / 3.º">
            {renderKO("M104")}
            {renderKO("M103")}
          </RoundColumn>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- UI: LOGIN -------------------------------- */

function LoginScreen({ onLogin, loading, error, cerrado }) {
  const [dni, setDni] = useState("");
  const ok = dni.length >= 6 && !loading;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-8 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>PRODE MUNDIAL 2026</h1>
        <p className="text-sm text-slate-400 mt-1 mb-6">48 selecciones · cruces oficiales FIFA</p>
        {cerrado && (
          <div className="rounded-xl bg-amber-950 border border-amber-700 text-amber-300 text-xs px-3 py-2 mb-4">
            El prode está cerrado. Si ya jugaste, entrá con tu DNI para ver tu pronóstico.
          </div>
        )}
        <input value={dni} onChange={e => setDni(e.target.value.replace(/\D/g,""))}
          onKeyDown={e => { if (e.key === "Enter" && ok) onLogin(dni); }}
          placeholder="Ingresá tu DNI" inputMode="numeric"
          className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white text-center border border-slate-600 focus:border-emerald-400 focus:outline-none mb-3" />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button onClick={() => ok && onLogin(dni)} disabled={!ok}
          className={`w-full py-3 rounded-xl font-bold ${ok ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 text-slate-500"}`}>
          {loading ? "Validando…" : "Ingresar"}
        </button>
        <a href="/ranking" className="block mt-4 text-sm text-emerald-400 hover:underline">Ver ranking →</a>
      </div>
    </div>
  );
}

/* --------------------------- APP PRINCIPAL -------------------------------- */

function sanitizePicks(raw, r32map) {
  const p = { ...raw };
  const ids = [...Object.keys(r32map), ...KO_ORDER];
  for (const id of ids) {
    if (p[id] == null) continue;
    const [a,b] = resolveTeams(id, r32map, p);
    if (p[id] !== a && p[id] !== b) delete p[id];
  }
  return p;
}

function ReadOnlyProde({ pred, usuario, dni }) {
  const fg = pred?.predicciones?.fase_grupos?.partidos || [];
  const fe = pred?.predicciones?.fase_eliminatoria?.partidos || [];
  const campeon = pred?.predicciones?.fase_eliminatoria?.campeon;
  const byGroup = {};
  fg.forEach(p => { (byGroup[p.grupo] = byGroup[p.grupo] || []).push(p); });
  const koByRound = {};
  fe.forEach(p => { (koByRound[p.ronda] = koByRound[p.ronda] || []).push(p); });
  const rounds = ["R32","R16","QF","SF","3P","F"];
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      <header className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>🏆 PRODE 2026</span>
        <a href="/ranking" className="text-xs text-emerald-400 hover:underline">Ver ranking →</a>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded-2xl bg-slate-950 border border-emerald-700 p-4 mb-6">
          <p className="font-bold">{usuario ? `${usuario.nombre} ${usuario.apellido}` : `DNI ${dni}`}</p>
          <p className="text-xs text-slate-400">Tu prode ya fue enviado · no se puede modificar 🔒</p>
        </div>

        <h2 className="text-lg font-black mb-3">Fase de grupos</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {GROUP_IDS.filter(g => byGroup[g]).map(g => (
            <div key={g} className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-emerald-400 font-bold mb-2">Grupo {g}</p>
              {byGroup[g].map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1 gap-2">
                  <span className="text-slate-300 truncate flex-1">{tn(p.equipo_local)}</span>
                  <span className="font-bold">{p.goles_local} - {p.goles_visitante}</span>
                  <span className="text-slate-300 truncate flex-1 text-right">{tn(p.equipo_visitante)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-black mb-3">Eliminatorias</h2>
        {rounds.filter(r => koByRound[r]).map(r => (
          <div key={r} className="mb-4">
            <p className="text-emerald-400 font-bold mb-1">{ROUND_TITLES[r]}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {koByRound[r].map(p => (
                <div key={p.id} className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm">
                  <span className={p.ganador === p.equipo_1 ? "text-emerald-300 font-bold" : "text-slate-500"}>{tn(p.equipo_1)}</span>
                  <span className="text-slate-600"> vs </span>
                  <span className={p.ganador === p.equipo_2 ? "text-emerald-300 font-bold" : "text-slate-500"}>{tn(p.equipo_2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-amber-950 border border-amber-700 p-4 text-center mt-6">
          <p className="text-xs text-amber-400 mb-1">Tu campeón</p>
          <p className="text-2xl font-black text-amber-300">{tn(campeon)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProdeMundial2026() {
  const [step, setStep] = useState("login");   // login | groups | knockout
  const [dni, setDni] = useState("");
  const [usuario, setUsuario] = useState(null); // {dni, nombre, apellido} validado contra el padrón
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [cerrado, setCerrado] = useState(prodeCerrado()); // (3) fecha de corte
  const [scores, setScores] = useState({});    // matchId -> {hs, as}
  const [rawPicks, setRawPicks] = useState({}); // matchId -> teamId ganador
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [miPrediccion, setMiPrediccion] = useState(null); // prode guardado (vista solo-lectura)
  const [toast, setToast] = useState(null);

  // (3) Re-chequea la fecha de corte mientras la pestaña está abierta y,
  //     al llegar el horario, deshabilita el formulario sin recargar.
  useEffect(() => {
    if (cerrado) return;
    const t = setInterval(() => { if (prodeCerrado()) setCerrado(true); }, 15000);
    return () => clearInterval(t);
  }, [cerrado]);

  const setScore = useCallback((id, s) => setScores(prev => ({ ...prev, [id]: s })), []);

  const complete = useMemo(() => allGroupsComplete(scores), [scores]);

  const allStand = useMemo(() => {
    const o = {};
    GROUP_IDS.forEach(g => { o[g] = standings(g, scores); });
    return o;
  }, [scores]);

  const r32 = useMemo(() => complete ? buildR32(allStand) : null, [complete, allStand]);
  const r32map = useMemo(() => {
    if (!r32) return {};
    const m = {}; r32.forEach(x => m[x.id] = x); return m;
  }, [r32]);

  // picks saneadas: descarta elecciones que dejaron de ser válidas al cambiar resultados
  const picks = useMemo(() => sanitizePicks(rawPicks, r32map), [rawPicks, r32map]);

  const onPick = useCallback((id, team) => {
    setRawPicks(prev => {
      const next = { ...prev };
      if (team == null) delete next[id]; else next[id] = team;
      return next;
    });
  }, []);

  const champion = picks["M104"] ? TEAMS[picks["M104"]] : null;

  const koComplete = useMemo(() => {
    if (!r32) return false;
    const ids = [...r32.map(x => x.id), ...KO_ORDER];
    return ids.every(id => picks[id] != null);
  }, [r32, picks]);

  const canSubmit = complete && koComplete && !cerrado;

  // (1)(2)(4) Valida el DNI contra el padrón, trae nombre/apellido y verifica
  //           si ya envió (en cuyo caso muestra la pantalla bloqueada).
  const handleLogin = async (d) => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const emp = await buscarEmpleado(d);
      if (!emp) { setLoginError("Tu DNI no está habilitado para participar."); return; }
      setUsuario(emp);
      setDni(emp.dni);
      const env = await consultarEnvio(emp.dni);
      if (env.enviado) {                         // ya jugó → traemos su prode para mostrarlo
        try { setMiPrediccion(await obtenerPrediccion(emp.dni)); } catch (_) {}
        setDone(true);
        return;
      }
      if (cerrado) { setStep("cerrado"); return; } // no jugó y ya cerró
      setStep("groups");
    } catch (e) {
      console.error(e);
      setLoginError("No pudimos validar tu DNI. Probá de nuevo.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (cerrado) { setToast("El prode está cerrado. Ya no se aceptan envíos."); setTimeout(() => setToast(null), 4000); return; }
    setSubmitting(true);
    try {
      const koMatches = [...r32, ...KO_ORDER.map(id => ({ id, n: META[id].n, round: META[id].r }))];
      const payload = {
        dni,
        nombre: usuario?.nombre ?? "",     // (4) para el Ranking
        apellido: usuario?.apellido ?? "", // (4) para el Ranking
        predicciones: {
          fase_grupos: {
            partidos: generateGroupMatches().map(m => ({
              id: m.id, grupo: m.group, equipo_local: m.home, equipo_visitante: m.away,
              goles_local: scores[m.id]?.hs ?? 0, goles_visitante: scores[m.id]?.as ?? 0,
            })),
            posiciones: Object.fromEntries(GROUP_IDS.map(g => [g, allStand[g].map((s,i) => ({
              posicion: i+1, equipo: s.team, puntos: s.pts, diferencia_goles: s.gd, goles_favor: s.gf,
            }))])),
          },
          fase_eliminatoria: {
            partidos: koMatches.map(m => {
              const [t1,t2] = resolveTeams(m.id, r32map, picks);
              return { id: m.id, numero: m.n, ronda: META[m.id]?.r ?? "R32",
                equipo_1: t1, equipo_2: t2, ganador: picks[m.id] ?? null };
            }),
            campeon: picks["M104"] ?? "",
          },
        },
        fecha_envio: new Date().toISOString(),
      };
      await savePrediction(payload); // ← tu conexión a Supabase
      setDone(true);
    } catch (e) {
      console.error(e);
      if (e.message === "DNI_YA_ENVIO") { setToast("Este DNI ya tiene un prode registrado."); setDone(true); }
      else if (e.message === "PRODE_CERRADO") { setCerrado(true); setToast("El prode se cerró: ya no se aceptan envíos."); }
      else setToast("Hubo un problema al guardar. Intentá de nuevo.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    if (miPrediccion) return <ReadOnlyProde pred={miPrediccion} usuario={usuario} dni={dni} />;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-3xl bg-slate-950 border border-emerald-700 p-8 text-center">
          <div className="text-5xl mb-3">{champion ? "✅" : "🔒"}</div>
          <h1 className="text-2xl font-black text-white">{champion ? "¡Prode Enviado!" : "Prode ya registrado"}</h1>
          <p className="text-slate-400 mt-1 mb-5">
            {usuario ? `${usuario.nombre} ${usuario.apellido} · DNI ${dni}` : `DNI ${dni}`}
          </p>
          {champion ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 mb-5">
              <p className="text-xs text-slate-500 mb-1">Tu campeón</p>
              <p className="text-2xl font-black text-amber-300">{champion.f} {champion.n}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-5">Este DNI ya tiene un prode cargado. El envío es de una sola vez, así que no admite modificaciones.</p>
          )}
          <a href="/ranking" className="inline-block px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">Ver ranking →</a>
        </div>
      </div>
    );
  }

  if (step === "cerrado") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-3xl bg-slate-950 border border-amber-700 p-8 text-center">
          <div className="text-5xl mb-3">⏰</div>
          <h1 className="text-2xl font-black text-white">Prode cerrado</h1>
          <p className="text-slate-400 mt-2 mb-5">
            {usuario ? `${usuario.nombre}, el` : "El"} plazo de carga finalizó el 11/06/2026 a las 16:00 hs y no llegaste a enviar tu prode.
          </p>
          <a href="/ranking" className="inline-block px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">Ver ranking →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-28">
      <header className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>🏆 PRODE 2026</span>
        {step !== "login" && (
          <span className="text-xs text-slate-500">
            {usuario ? `${usuario.nombre} ${usuario.apellido} · ${dni}` : `DNI ${dni}`}
          </span>
        )}
      </header>

      {cerrado && step !== "login" && (
        <div className="bg-amber-950 border-b border-amber-800 text-amber-300 text-center text-sm px-4 py-2">
          🔒 El prode está cerrado (cierre: 11/06/2026 16:00 hs). No se aceptan envíos.
        </div>
      )}

      {step === "login" && <LoginScreen onLogin={handleLogin} loading={loginLoading} error={loginError} cerrado={cerrado} />}

      {step === "groups" && (
        <GroupStage scores={scores} setScore={setScore} allStand={allStand}
          complete={complete} onContinue={() => setStep("knockout")} />
      )}

      {step === "knockout" && r32 && (
        <KnockoutStage r32={r32} r32map={r32map} picks={picks} onPick={onPick}
          onBack={() => setStep("groups")} />
      )}

      {step === "knockout" && !r32 && (
        <div className="max-w-md mx-auto px-4 py-10 text-center text-slate-400">
          Completá todos los partidos de grupos para desbloquear los cruces.
          <div className="mt-4"><button onClick={() => setStep("groups")} className="px-4 py-2 rounded-xl bg-slate-800">← Volver a Grupos</button></div>
        </div>
      )}

      {step !== "login" && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-slate-950 border-t border-slate-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {cerrado ? "El prode está cerrado — no se aceptan envíos"
                : !complete ? "Faltan cargar partidos de grupos"
                : !koComplete ? "Definí todos los cruces hasta la final"
                : champion ? `Campeón: ${champion.f} ${champion.n}` : "Listo para enviar"}
            </span>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              className={`px-5 py-2 rounded-xl font-bold text-sm ${canSubmit && !submitting ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>
              {submitting ? "Enviando…" : "Enviar Prode"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center z-30">
          <div className="bg-red-600 text-white text-sm px-4 py-2 rounded-xl">{toast}</div>
        </div>
      )}
    </div>
  );
}