export type CoupleEntry = { code: string; partners: [string, string] }
export type SingleEntry = { code: string; name: string }

export const couples: CoupleEntry[] = [
  // Danielle's guests
  { code: "26879a81-55b5-44ff-9bf6-90825aa3b8b3", partners: ["Jenny", "Rhett"] },
  { code: "ef1c087d-e13a-413c-a505-d6c894753783", partners: ["Aidan", "Agnès"] },
  { code: "d786ad0e-bbbd-406f-a40e-961763d9b226", partners: ["Géraldine", "Maël"] },
  { code: "897c9888-1a26-42f2-8067-06f5759a6d65", partners: ["Zoé", "Andrew"] },
  { code: "2eff4d8a-2c80-48e2-8205-34e00669bb1e", partners: ["Lidia", "Antony"] },
  { code: "18a3970a-5b76-43fb-9674-5fdc3bcb1553", partners: ["Kyrha", "JB"] },
  { code: "a6b26743-2535-4b60-b3d3-2d953c975dc1", partners: ["Aline", "Marko"] },
  { code: "a3f67718-1dd4-4f6c-ac73-fe4fa8380a39", partners: ["Dounia", "Seb"] },
  { code: "77dc99af-0e6f-4397-9533-1043877c5761", partners: ["Olivia", "Patrick"] },
  { code: "ec6b250d-5de8-417f-b640-3e614481eac2", partners: ["Marielle", "Antoine"] },
  // David's guests
  { code: "f7651bc7-28a8-49c0-9cfa-09c9c37a9941", partners: ["Véronique", "Rodrigo"] },
  { code: "f4f5340e-0a11-41be-9000-a13653761d42", partners: ["Joël", "Kylie"] },
  { code: "5ff88491-5786-4ada-b675-3e508c7440ca", partners: ["Jordy", "Aurélie"] },
  { code: "4b37f155-915d-41f4-a936-5c2efe309a89", partners: ["Isaac", "Nour"] },
  { code: "5d55ad80-d98b-4f42-820c-71ea40388b76", partners: ["Damien", "Alexandra"] },
  { code: "3631755e-4bcf-45cc-9a5e-d1f57ee2c9ce", partners: ["Vincent", "Jessica"] },
  { code: "6dcc9458-fb96-4df1-9c98-2c33ba97c2dc", partners: ["Jérémie", "Eva"] },
  { code: "02b451bc-f3e0-4052-821a-5c7b37848564", partners: ["Thibaut", "Fanny"] },
  { code: "053a2c77-7c32-42bd-9703-429faf6368bf", partners: ["Nico", "Gab"] },
  { code: "db60cd6c-af91-4ada-84c2-0d086005c3f9", partners: ["Michay", "Jeanne"] },
  { code: "801516a7-28b1-440d-8d2e-a382a8b712ee", partners: ["Marion", "Isaïa"] },
  { code: "9cec1ede-4c81-473c-acf9-924432d056ad", partners: ["Saad", "Fatima"] },
  { code: "48502ada-ed40-4691-96be-28f88313a23e", partners: ["Kilian", "Sophie"] },
  { code: "def7848a-b226-46de-bb44-3f5dc4feace1", partners: ["Damien", "Namya"] },
  { code: "e7cf15bd-9a02-4afd-9ff4-c9184b239c65", partners: ["Eric", "Pauline"] },
  { code: "b65f7d79-aa1d-488b-a6b5-933b3d9358f8", partners: ["Cyprien", "Mélo"] },
]

export const singles: SingleEntry[] = [
  // Danielle's guests
  { code: "18bbe990-c7de-4676-8859-1036b47a2127", name: "Sophie" },
  { code: "08d20f30-a04e-4c35-adea-c3a9959ca9f3", name: "Ciara" },
  { code: "3cf46b5e-ec73-44de-9357-dec5c5061891", name: "Delphine" },
  { code: "af4c9fb5-080d-4cce-88be-93127d968626", name: "Carolina" },
  { code: "6bab9364-73f6-4ef1-b11a-51c5d12007c5", name: "Oriane" },
  // David's guests
  { code: "61ebf513-5551-40fd-b20c-a8a06f119a68", name: "Beatriz" },
  { code: "77d12b67-bf3c-43b0-a11e-2594b2d97340", name: "Elyes" },
  { code: "6f1b3324-bf90-4729-a3a3-ea7d77e6e5df", name: "Matthias" },
  { code: "1255fef6-a956-4322-bd58-224f46412bdd", name: "Olivier" },
  { code: "8df16861-4764-4718-babf-288d31ddf419", name: "Astrid" },
  { code: "83bdca0b-5c37-43ea-ad45-fd558a9659ec", name: "Cedric Burky" },
  { code: "e1ed7153-d18b-4083-a36f-d687b3f9b47f", name: "Romain" },
  { code: "dcf962a0-7a88-4084-9509-9b4073976a96", name: "Alex Rossignol" },
  { code: "9ae643c7-a49b-40e3-b448-a1df4bd0f31d", name: "Bryan K." },
  { code: "2dc8d5f8-2e99-46eb-9aa5-468e0865e9cb", name: "Annabelle" },
  { code: "f177e39e-ef8b-4d99-b98c-41fe32d2050d", name: "Keli" },
  { code: "e847a925-b805-41e6-9a09-52d165584857", name: "Benjamin" },
  { code: "36b2611c-005f-431b-b24e-f591cb9dc955", name: "Bryan S." },
]
