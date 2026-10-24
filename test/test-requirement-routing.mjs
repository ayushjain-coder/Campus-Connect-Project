import assert from "assert";

async function testRequirementRouting() {
  const auth = await fetch("http://localhost:3000/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student.demo@campusconnect.demo", password: "Demo@12345" })
  }).then(r => r.json());
  
  const token = auth.token;
  
  const testCases = [
    {
      req: "Student fainted with chest pain in classroom",
      expectedType: "Medical",
      expectedStaff: "Dr. Priya Sharma",
      expectedPhone: "+91 98202 34567"
    },
    {
      req: "Thick smoke and flames spreading in corridor",
      expectedType: "Fire / Smoke",
      expectedStaff: "Vikram Rao",
      expectedPhone: "+91 98205 67890"
    },
    {
      req: "Intruder fighting and assault in hostel gate",
      expectedType: "Security / Safety",
      expectedStaff: "Amit Verma",
      expectedPhone: "+91 98203 45678"
    },
    {
      req: "Main pipe burst and heavy water flooding the room",
      expectedType: "Flooding",
      expectedStaff: "Rajesh Kumar",
      expectedPhone: "+91 98201 23456"
    },
    {
      req: "LPG cylinder gas leak odor in pantry",
      expectedType: "Gas Leak",
      expectedStaff: "Rajesh Kumar",
      expectedPhone: "+91 98201 23456"
    }
  ];

  console.log("=== Testing Student Requirement -> Specific Staff Member Assignment ===");
  for (const tc of testCases) {
    const res = await fetch("http://localhost:3000/api/emergencies/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ requirement: tc.req })
    }).then(r => r.json());

    console.log(`\nRequirement: "${tc.req}"`);
    console.log(`  ✓ Classified Type : ${res.classifiedType}`);
    console.log(`  ✓ Assigned Staff  : ${res.responder?.name}`);
    console.log(`  ✓ Staff Direct Tel: ${res.responder?.phoneNumber}`);
    assert.strictEqual(res.classifiedType, tc.expectedType);
    assert.strictEqual(res.responder?.name, tc.expectedStaff);
    assert.strictEqual(res.responder?.phoneNumber, tc.expectedPhone);
  }

  console.log("\n=======================================================");
  console.log("ALL REQUIREMENT-TO-STAFF ROUTING CHECKS PASSED (100%)");
  console.log("=======================================================");
}

testRequirementRouting();
