# API Modes and Compatibility

## Overview

This node supports two credential modes:

- `Stable / Legacy (API v2.0.4)`
- `Next / Dev (API v2.1.x)`

The active mode controls:

- which resources appear in the editor
- which operations are available
- which transport path the node uses at runtime

## Compatibility Labels

Each operation belongs to one of these categories:

| Label | Meaning |
| --- | --- |
| `stable-only` | Available only in `Stable / Legacy` mode |
| `both` | Available in both modes without special adaptation |
| `both-with-adapter` | Available in both modes, but the node uses mode-specific routing or response handling |

## Current Compatibility Summary

| Category | Count |
| --- | ---: |
| `stable-only` | 63 |
| `both` | 1 |
| `both-with-adapter` | 22 |

## What Changes in the Editor

When the credential is in `Stable / Legacy` mode:

- all stable operations stay visible
- dual-mode operations stay visible
- stable-only resources such as alerts, evidence, notes, timeline, and datastore remain available

When the credential is in `Next / Dev` mode:

- only operations supported by `next` remain visible
- stable-only resources disappear from the operation picker
- `API Request` remains available

## Dual-Mode Surface

These resource families support `Next / Dev` through the compatibility layer:

- `Case`
- `Asset`
- `IOC`
- `Task`
- `API Request`

Everything else is currently `stable-only`.

## When to Choose Each Mode

### Choose `Stable / Legacy`

- for released IRIS versions
- when you need the widest feature set
- when you rely on alerts, datastore, notes, evidence, modules, or timeline

### Choose `Next / Dev`

- when your backend exposes `api/v2/...`
- when you specifically need the newer case, asset, IOC, or task flows
- when you are comfortable with a narrower but modernized operation set

## Important Limits

- `Next / Dev` does not make every operation available
- hidden stable-only operations are intentionally unavailable in `next`
- the node does not promise support beyond the compatibility manifest

For the full operation inventory, see [Resource overview](./resources.md) and the grouped [reference pages](./reference/cases-and-alerts.md).
