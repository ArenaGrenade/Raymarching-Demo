export const vertexShader = `
    attribute vec3 position;

    void main(void) {
        gl_Position = vec4(position, 1.0);
    }
`;

// SDFs at http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

export const fragmentShader = `
    #define MAX_STEPS 100
    #define MAX_DIST 100.0
    #define SURF_DIST 0.001
    #define PI 3.142

    precision highp float;

    uniform vec2 resolution;
    uniform vec2 viewportSize;
    uniform float time;
    uniform float power;
    uniform mat4 invTransformMat;

    float atan2(in float y, in float x)
    {
        return x == 0.0 ? sign(y) * PI / 2.0 : atan(y, x);
    }

    float signedDistToSphere(vec3 p, vec4 sphere) {
        return length(sphere.xyz - p) - sphere.w;
    }

    float signedDistToBox(vec3 p, vec3 center, vec3 size) {
        vec3 offset = abs(p - center) - size;
        float unsignedDist = length(max(offset, 0.0));
        float distInsideBox = min(max(offset.x, max(offset.y, offset.z)), 0.0);
        return unsignedDist + distInsideBox;
    }

    float signedDistToRoundedbox(vec3 p, vec3 center, vec3 size, float smoothing) {
        return signedDistToBox(p, center, size - vec3(smoothing)) - smoothing;
    }

    float signedDistToInfiniteCylinder(vec3 p, vec2 center, float radius) {
        return length(p.xz - center) - radius;
    }

    float signedDistToPlane(vec3 p) {
        return p.y;
    }

    float signedDistToMandelBulb(vec3 p) {
        vec3 z = p;
        float dr = 1.0;
        float r;

        for (int i = 0; i < 15; i++) {
            r = length(z);
            if (r > 2.0) break;

            float theta = acos(z.z / r) * power;
            float phi = atan2(z.y, z.x) * power;
            float zr = pow(r, power);
            dr = pow(r, power - 1.0) * power * dr + 1.0;

            z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
            z += p;
        }

        return 0.5 * log(r) * r / dr;
    }

    /*
    float smoothMin(vec4 objA, vec4 objB, float k) {
        float h = max(k - abs(objA.x - objB.x), 0.0) / k;
        float distance = min(objA, objB) - h * h * h * k * 1.0 / 6.0;
        vec3 color = lerp(objA.yzw, objB.yzw, h);
        return vec4(distance, color);
    }*/

    vec3 transformPoint(vec3 p) {
        return (invTransformMat * vec4(p, 1.0)).xyz;
    }

    vec4 GetSceneDist(vec3 p) {
        // float box = signedDistToBox(p, vec3(-1.5, 1, 6), vec3(1));
        // float sphere = signedDistToSphere(p, vec4(1.5, 1, 6, 1));
        // float plane = signedDistToPlane(p);
        // float infCylinder = signedDistToInfiniteCylinder(p, vec2(0, 6), 0.5);
        // float roundedBox = signedDistToRoundedbox(p, vec3(-1.5, 1, 6), vec3(1), 0.0);

        vec3 transformed = transformPoint(p);
        vec4 mandelBulb = vec4(signedDistToMandelBulb(transformed), vec3(0.0, 0.42, 0.22));

        return mandelBulb;
    }

    vec4 RayMarch(vec3 ro, vec3 rd) {
        float d0 = 0.0;
        vec3 c = vec3(0.0);

        for (int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * d0;
            vec4 objF = GetSceneDist(p);
            d0 += objF.x;
            c = objF.yzw;

            if (d0 > MAX_DIST) {
                c = vec3(0.0);
                break;
            }
            if (abs(objF.x) < SURF_DIST) break;
        }

        return vec4(d0, c);
    }

    vec3 CalculateNormal (vec3 p) {
        vec4 d = GetSceneDist(p);
        vec2 e = vec2(0.01, 0);

        vec3 n = d.x - vec3(
            GetSceneDist(p - e.xyy).x,
            GetSceneDist(p - e.yxy).x,
            GetSceneDist(p - e.yyx).x
        );

        return normalize(n);
    }

    float CalculateLighting (vec3 p) {
        vec3 lightPos = vec3(0, 0.6, -2);
        vec3 l = normalize(lightPos - p);

        vec3 n = CalculateNormal(p);

        float diffuse = clamp(dot(n, l), 0.0, 1.0);

        vec4 d = RayMarch(p + n * SURF_DIST * 2.0, l);
        if (d.x < length(lightPos - p)) diffuse *= 0.1;

        return (diffuse - 0.5) * 0.7;
    }

    void main(void) {
        // Get the scaled screen space coordinate
        vec2 uv = (gl_FragCoord.xy - 0.5 * viewportSize) / resolution;

        // Convert the ray direction from normalized screen coordinate to world space coordinate
        vec3 ray = normalize(vec3(uv.x, uv.y, 1));

        // Get Camera Position
        vec3 cPos = vec3(0, 0, -5);

        // Cast the ray and calculate the color
        vec3 col = vec3(0.0);
        vec4 final_obj = RayMarch(cPos, ray);
        col = final_obj.yzw;
        float d = final_obj.x;

        vec3 p = cPos + ray * d;
        float litColor = CalculateLighting(p);
        col += vec3(litColor);

        gl_FragColor = vec4(col, 1.0);
    }
`;