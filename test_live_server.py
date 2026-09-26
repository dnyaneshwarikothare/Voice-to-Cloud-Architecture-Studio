import urllib.request
import json
import sys

def run_tests():
    print("=== LIVE SERVER INTEGRATION TESTS ===")

    # 1. Test Vite dev server
    try:
        vite_res = urllib.request.urlopen("http://localhost:5173/")
        assert vite_res.status == 200
        html = vite_res.read().decode("utf-8")
        assert "Voice-to-Cloud Architecture Studio" in html
        print("[PASS] Vite Frontend dev server responding on http://localhost:5173/")
    except Exception as e:
        print(f"[FAIL] Vite frontend test: {e}")
        return False

    # 2. Test FastAPI analyze-requirements
    try:
        req_data = json.dumps({"text": "I want to build a shopping website."}).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/analyze-requirements",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        analysis = json.loads(res.read().decode("utf-8"))
        assert analysis["application_type"] == "E-commerce"
        assert len(analysis["questions"]) > 0
        print(f"[PASS] Backend analyze-requirements: Type = '{analysis['application_type']}', Questions = {len(analysis['questions'])}")
    except Exception as e:
        print(f"[FAIL] analyze-requirements: {e}")
        return False

    # 3. Test generate-architecture with non-technical answers
    try:
        gen_data = json.dumps({
            "prompt": "I want to build a shopping website.",
            "application_type": "E-commerce",
            "answers": {"users": "100,000+", "payments": "yes", "uploads": "yes"}
        }).encode("utf-8")
        req2 = urllib.request.Request(
            "http://127.0.0.1:8000/api/generate-architecture",
            data=gen_data,
            headers={"Content-Type": "application/json"}
        )
        res2 = urllib.request.urlopen(req2)
        arch = json.loads(res2.read().decode("utf-8"))
        comp_names = [c["name"] for c in arch["components"]]
        print(f"[PASS] Backend generate-architecture: {len(arch['components'])} components, sample = {comp_names[:4]}")
        assert any("Storefront" in n or "Frontend" in n for n in comp_names)
        assert any("Product" in n for n in comp_names)
        assert any("Payment" in n for n in comp_names)
        assert any("Database" in n or "PostgreSQL" in n for n in comp_names)
    except Exception as e:
        print(f"[FAIL] generate-architecture: {e}")
        return False

    # 4. Test simulate-failure (Database failure)
    try:
        db_comp = next(c for c in arch["components"] if "Database" in c["role"] or "PostgreSQL" in c["name"])
        fail_data = json.dumps({
            "architecture": arch,
            "failure_target_id": db_comp["id"]
        }).encode("utf-8")
        req3 = urllib.request.Request(
            "http://127.0.0.1:8000/api/simulate-failure",
            data=fail_data,
            headers={"Content-Type": "application/json"}
        )
        res3 = urllib.request.urlopen(req3)
        fail_res = json.loads(res3.read().decode("utf-8"))
        print(f"[PASS] Backend simulate-failure: Origin = {fail_res['failed_component_ids']}, Cascaded = {len(fail_res['cascaded_failed_component_ids'])}, Mitigations = {len(fail_res['mitigation_strategies'])}")
    except Exception as e:
        print(f"[FAIL] simulate-failure: {e}")
        return False

    # 5. Test cost estimation (AWS vs GCP)
    try:
        cost_data = json.dumps({
            "architecture": arch,
            "assumptions": {"monthly_active_users": 100000}
        }).encode("utf-8")
        req4 = urllib.request.Request(
            "http://127.0.0.1:8000/api/estimate-cost",
            data=cost_data,
            headers={"Content-Type": "application/json"}
        )
        res4 = urllib.request.urlopen(req4)
        cost_res = json.loads(res4.read().decode("utf-8"))
        assert "estimate" in cost_res["disclaimer"].lower()
        aws_cost = cost_res["aws"]["estimated_monthly_cost"]
        gcp_cost = cost_res["gcp"]["estimated_monthly_cost"]
        print(f"[PASS] Backend estimate-cost: AWS = ${aws_cost:.2f}/mo, GCP = ${gcp_cost:.2f}/mo, Cheaper = {cost_res['cheaper_provider'].upper()}")
    except Exception as e:
        print(f"[FAIL] estimate-cost: {e}")
        return False

    # 6. Test traffic simulation with 1,000,000 users
    try:
        traf_data = json.dumps({
            "architecture": arch,
            "current_users": 10000,
            "future_users": 1000000,
            "requests_per_second": 1200
        }).encode("utf-8")
        req5 = urllib.request.Request(
            "http://127.0.0.1:8000/api/simulate-traffic",
            data=traf_data,
            headers={"Content-Type": "application/json"}
        )
        res5 = urllib.request.urlopen(req5)
        traf_res = json.loads(res5.read().decode("utf-8"))
        assert traf_res["status"] in ["HIGH LOAD", "CRITICAL", "NORMAL"]
        print(f"[PASS] Backend simulate-traffic (1M users): Status = {traf_res['status']}, Bottlenecks detected = {len(traf_res['bottlenecks'])}")
    except Exception as e:
        print(f"[FAIL] simulate-traffic: {e}")
        return False

    # 7. Test health analysis
    try:
        h_data = json.dumps({"architecture": arch}).encode("utf-8")
        req_h = urllib.request.Request(
            "http://127.0.0.1:8000/api/analyze-health",
            data=h_data,
            headers={"Content-Type": "application/json"}
        )
        res_h = urllib.request.urlopen(req_h)
        h_res = json.loads(res_h.read().decode("utf-8"))
        print(f"[PASS] Backend analyze-health: Overall = {h_res['overall_score']}, Security = {h_res['pillars']['security']['score']}")
    except Exception as e:
        print(f"[FAIL] analyze-health: {e}")
        return False

    # 8. Test optimizer
    try:
        opt_data = json.dumps({"architecture": arch}).encode("utf-8")
        req_opt = urllib.request.Request(
            "http://127.0.0.1:8000/api/optimize",
            data=opt_data,
            headers={"Content-Type": "application/json"}
        )
        res_opt = urllib.request.urlopen(req_opt)
        opt_res = json.loads(res_opt.read().decode("utf-8"))
        assert len(opt_res["tradeoffs"]) == 3
        print(f"[PASS] Backend optimize: Trade-offs = {[v['name'] for v in opt_res['tradeoffs'].values()]}")
    except Exception as e:
        print(f"[FAIL] optimize: {e}")
        return False

    # 9. Test Terraform generation
    try:
        tf_data = json.dumps({"architecture": arch, "provider": "aws"}).encode("utf-8")
        req6 = urllib.request.Request(
            "http://127.0.0.1:8000/api/generate-terraform",
            data=tf_data,
            headers={"Content-Type": "application/json"}
        )
        res6 = urllib.request.urlopen(req6)
        tf_res = json.loads(res6.read().decode("utf-8"))
        assert len(tf_res["hcl_code"]) > 50
        print(f"[PASS] Backend generate-terraform: Provider = {tf_res['cloud_provider']}, HCL lines = {len(tf_res['hcl_code'].splitlines())}")
    except Exception as e:
        print(f"[FAIL] generate-terraform: {e}")
        return False

    # 10. Test project SQLite persistence
    try:
        proj_payload = json.dumps({
            "name": "Live Test Project",
            "description": "Verification test run",
            "architecture": arch
        }).encode("utf-8")
        req7 = urllib.request.Request(
            "http://127.0.0.1:8000/api/projects",
            data=proj_payload,
            headers={"Content-Type": "application/json"}
        )
        res7 = urllib.request.urlopen(req7)
        saved_proj = json.loads(res7.read().decode("utf-8"))
        assert saved_proj["id"]
        print(f"[PASS] Backend SQLite persistence: Saved project ID {saved_proj['id']}, Name '{saved_proj['name']}'")

        # Query all projects
        req8 = urllib.request.Request("http://127.0.0.1:8000/api/projects")
        res8 = urllib.request.urlopen(req8)
        all_projs = json.loads(res8.read().decode("utf-8"))
        assert len(all_projs) >= 1
        print(f"[PASS] Backend SQLite list: Retrieved {len(all_projs)} projects")
    except Exception as e:
        print(f"[FAIL] projects persistence: {e}")
        return False

    print("\nALL 10 LIVE SERVER INTEGRATION CHECKS PASSED PERFECTLY!")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
